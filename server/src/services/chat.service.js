import { pool } from "../db/db.js";
import logger from "../utils/logger.js";

// ─────────────────────────────────────────────
// Intent Definitions
// ─────────────────────────────────────────────
const INTENTS = [
  // ── Voter ──────────────────────────────────
  {
    name: "how_to_vote",
    roles: ["voter", "admin", "officer"],
    patterns: [/how.*vote/i, /cast.*vote/i, /voting.*process/i, /how do i vote/i, /start voting/i],
  },
  {
    name: "vote_confirmed",
    roles: ["voter"],
    patterns: [/is.*vote.*counted/i, /vote.*confirmed/i, /did.*vote.*go through/i, /my vote.*counted/i, /vote.*registered/i],
  },
  {
    name: "what_is_otp",
    roles: ["voter", "admin", "officer"],
    patterns: [/what.*otp/i, /why.*otp/i, /otp.*mean/i, /need.*otp/i, /otp.*required/i, /verification code/i],
  },
  {
    name: "when_results",
    roles: ["voter", "admin", "officer"],
    patterns: [/when.*result/i, /result.*available/i, /see.*result/i, /when.*winner/i, /who.*won/i, /announcement/i],
  },
  {
    name: "my_elections",
    roles: ["voter"],
    patterns: [/which election/i, /what.*election/i, /available election/i, /can.*vote.*in/i, /open.*election/i],
  },
  {
    name: "verify_vote",
    roles: ["voter", "admin", "officer"],
    patterns: [/verify.*vote/i, /check.*vote/i, /proof.*vote/i, /vote.*hash/i, /audit.*vote/i, /vote.*token/i],
  },
  {
    name: "election_status",
    roles: ["voter", "admin", "officer"],
    patterns: [/election.*status/i, /is.*election.*active/i, /election.*open/i, /when.*election.*start/i, /election.*end/i],
  },
  // ── Admin / Officer ─────────────────────────
  {
    name: "show_turnout",
    roles: ["admin", "officer"],
    patterns: [/turnout/i, /how many.*vote/i, /votes.*today/i, /vote.*count/i, /total.*vote/i, /participation/i],
  },
  {
    name: "active_elections_count",
    roles: ["admin", "officer"],
    patterns: [/active.*election/i, /how many.*election/i, /election.*running/i, /ongoing.*election/i],
  },
  {
    name: "top_candidate",
    roles: ["admin", "officer"],
    patterns: [/top.*candidate/i, /leading candidate/i, /who.*leading/i, /most.*vote/i, /winning/i],
  },
  {
    name: "fraud_alerts",
    roles: ["admin"],
    patterns: [/fraud/i, /suspicious/i, /alert/i, /anomaly/i, /ip.*flag/i, /multiple.*vote/i],
  },
  {
    name: "recent_votes",
    roles: ["admin", "officer"],
    patterns: [/recent.*vote/i, /latest.*vote/i, /last.*vote/i, /vote.*activity/i],
  },
  // ── Universal ───────────────────────────────
  {
    name: "greeting",
    roles: ["voter", "admin", "officer"],
    patterns: [/^hi$/i, /^hello$/i, /^hey$/i, /good (morning|afternoon|evening)/i, /^greet/i],
  },
  {
    name: "help",
    roles: ["voter", "admin", "officer"],
    patterns: [/help/i, /what can you do/i, /what.*commands/i, /options/i, /guide/i],
  },
];

// ─────────────────────────────────────────────
// Intent Detection
// ─────────────────────────────────────────────
const detectIntent = (message, role) => {
  const allowed = INTENTS.filter((i) => i.roles.includes(role));
  for (const intent of allowed) {
    for (const pattern of intent.patterns) {
      if (pattern.test(message)) return intent.name;
    }
  }
  return "unknown";
};

// ─────────────────────────────────────────────
// Live Data Fetchers
// ─────────────────────────────────────────────
const fetchTurnout = async () => {
  const res = await pool.query(`
    SELECT
      COUNT(*) FILTER (WHERE voted_at >= NOW() - INTERVAL '24 hours') AS today,
      COUNT(*) AS total,
      (SELECT title FROM elections WHERE status = 'active' ORDER BY created_at DESC LIMIT 1) AS top_election,
      (SELECT COUNT(*) FILTER (WHERE voted_at >= NOW() - INTERVAL '24 hours')
       FROM votes v2
       WHERE v2.election_id = (SELECT id FROM elections WHERE status = 'active' ORDER BY created_at DESC LIMIT 1)) AS top_election_votes,
      (SELECT COUNT(*) FROM elections WHERE status = 'active') AS active_count
    FROM votes
  `);
  return res.rows[0];
};

const fetchActiveElections = async () => {
  const res = await pool.query(`
    SELECT e.title, e.end_time, e.election_level,
           COUNT(v.id) AS vote_count
    FROM elections e
    LEFT JOIN votes v ON v.election_id = e.id
    WHERE e.status = 'active'
    GROUP BY e.id
    ORDER BY vote_count DESC
    LIMIT 5
  `);
  return res.rows;
};

const fetchTopCandidates = async () => {
  const res = await pool.query(`
    SELECT c.name, c.party, e.title AS election_title, COUNT(v.id) AS votes
    FROM candidates c
    LEFT JOIN votes v ON v.candidate_id = c.id
    JOIN elections e ON c.election_id = e.id
    WHERE e.status = 'active'
    GROUP BY c.id, e.title
    ORDER BY votes DESC
    LIMIT 5
  `);
  return res.rows;
};

const fetchRecentVotes = async () => {
  const res = await pool.query(`
    SELECT v.voted_at, e.title AS election_title, v.ip_address
    FROM votes v
    JOIN elections e ON v.election_id = e.id
    ORDER BY v.voted_at DESC
    LIMIT 5
  `);
  return res.rows;
};

const fetchSuspiciousActivity = async () => {
  const res = await pool.query(`
    SELECT ip_address, COUNT(*) AS vote_count
    FROM votes
    WHERE voted_at >= NOW() - INTERVAL '1 hour'
    GROUP BY ip_address
    HAVING COUNT(*) > 5
    ORDER BY vote_count DESC
    LIMIT 5
  `);
  return res.rows;
};

const fetchElectionStatus = async () => {
  const res = await pool.query(`
    SELECT title, status, start_time, end_time, election_level
    FROM elections
    WHERE status IN ('active', 'upcoming')
    ORDER BY start_time ASC
    LIMIT 5
  `);
  return res.rows;
};

// ─────────────────────────────────────────────
// Response Generator
// ─────────────────────────────────────────────
const generateResponse = async (intent, role, userName) => {
  const name = userName?.split(" ")[0] || "there";

  switch (intent) {
    case "greeting":
      if (role === "admin")
        return `👋 Hello, **${name}**! I'm your election management assistant. Ask me about turnout, active elections, top candidates, or recent activity.`;
      if (role === "officer")
        return `👋 Hey, **${name}**! I can help you monitor elections and candidates. Try asking about active elections or today's turnout.`;
      return `👋 Hello, **${name}**! I'm here to help you with the voting process. You can ask me how to vote, check election status, or verify your vote!`;

    case "help":
      if (role === "admin") {
        return `🤖 Here's what I can help you with:\n\n📊 **Live Data**\n- "Show turnout today"\n- "Active elections"\n- "Top candidates"\n- "Recent votes"\n- "Fraud alerts"\n\n🗳️ **General**\n- "How do I vote?"\n- "Election status"\n- "Verify a vote"`;
      }
      if (role === "officer") {
        return `🤖 Here's what I can help you with:\n\n📊 **Monitoring**\n- "Active elections"\n- "Top candidates"\n- "Recent votes"\n- "Show turnout"\n\n🗳️ **General**\n- "Election status"\n- "How do I vote?"`;
      }
      return `🤖 Here's what I can help you with:\n\n🗳️ **Voting**\n- "How do I vote?"\n- "Is my vote counted?"\n- "What is OTP?"\n- "Verify my vote"\n\n📋 **Elections**\n- "What elections can I vote in?"\n- "When are results out?"`;

    case "how_to_vote":
      return `🗳️ **How to Cast Your Vote:**\n\n1️⃣ Go to your **Dashboard** and find an **Active** election\n2️⃣ Click on the election to open it\n3️⃣ Select your preferred candidate\n4️⃣ Click **"Secure Vote with OTP"**\n5️⃣ Click **"Get OTP"** and enter the 6-digit code\n6️⃣ Click **"Verify & Cast Vote"**\n\n✅ Your vote is then cryptographically sealed and processed securely!`;

    case "vote_confirmed": {
      return `✅ **Yes, your vote is secure!**\n\nOnce you submit your vote:\n- It enters our **secure processing queue** (BullMQ + Redis)\n- A unique cryptographic hash is generated: \`SHA256(you + candidate + prevHash)\`\n- Your vote is **chained** to the previous one, making tampering impossible\n\n🔍 You can verify your vote anytime on the **Verify Vote** page using your vote token.`;
    }

    case "what_is_otp":
      return `🔐 **OTP (One-Time Password)** is an extra layer of identity verification before voting.\n\n**Why is it needed?**\nIt ensures only the real voter casts their ballot — simulating real-world identity verification like Aadhaar.\n\n**How to get it:**\n1. On the voting confirmation screen, click **"Get OTP"**\n2. A 6-digit code is sent/generated\n3. Enter the code to confirm your identity\n\n⚠️ OTP codes expire quickly, so use them right away!`;

    case "when_results": {
      const elections = await fetchElectionStatus();
      if (!elections.length)
        return `📊 There are no active or upcoming elections right now. Results from past elections may already be visible on their respective pages.`;
      const list = elections
        .map((e) => `- **${e.title}** (${e.status}) — ends ${new Date(e.end_time).toLocaleString()}`)
        .join("\n");
      return `📅 **Election Timeline:**\n\n${list}\n\n🔓 Results are published by the admin after an election ends. You'll see them automatically on the election page.`;
    }

    case "verify_vote":
      return `🔍 **Verify Your Vote:**\n\n1. Go to **Verify Vote** in the sidebar\n2. Enter your vote **hash / token** (provided after voting)\n3. The system checks the cryptographic chain\n\nThis proves your vote exists in the system without revealing your choice. That's the power of our blockchain-inspired audit trail!`;

    case "my_elections":
    case "election_status": {
      const elections = await fetchElectionStatus();
      if (!elections.length)
        return `🗳️ There are currently **no active or upcoming elections**. Check back later or ask your admin when the next election begins!`;
      const list = elections
        .map((e) => `- **${e.title}** • ${e.status.toUpperCase()} • ${e.election_level} level`)
        .join("\n");
      return `🗳️ **Current Elections:**\n\n${list}\n\nClick any election on the Dashboard to participate!`;
    }

    // ── Admin intents ──────────────────────────
    case "show_turnout": {
      const data = await fetchTurnout();
      const today = parseInt(data.today || 0);
      const total = parseInt(data.total || 0);
      const active = parseInt(data.active_count || 0);
      const topVotes = parseInt(data.top_election_votes || 0);
      return `📊 **Live Turnout Report:**\n\n- 🗓️ Votes in last **24 hours**: **${today}**\n- 📦 Total votes ever: **${total}**\n- 🟢 Active elections: **${active}**${data.top_election ? `\n- 🏆 Most active: **${data.top_election}** with **${topVotes}** votes today` : ""}`;
    }

    case "active_elections_count": {
      const elections = await fetchActiveElections();
      if (!elections.length)
        return `🟡 There are currently **no active elections**. You can create one from the Manage Elections page.`;
      const list = elections
        .map((e) => `- **${e.title}** (${e.election_level}) — ${e.vote_count} votes cast`)
        .join("\n");
      return `🟢 **${elections.length} Active Election(s):**\n\n${list}`;
    }

    case "top_candidate": {
      const candidates = await fetchTopCandidates();
      if (!candidates.length)
        return `📭 No votes have been cast in any active election yet.`;
      const list = candidates
        .map((c, i) => `${i + 1}. **${c.name}** (${c.party || "Independent"}) — *${c.election_title}* — **${c.votes} votes**`)
        .join("\n");
      return `🏆 **Leading Candidates (Active Elections):**\n\n${list}`;
    }

    case "recent_votes": {
      const votes = await fetchRecentVotes();
      if (!votes.length) return `📭 No votes have been recorded yet.`;
      const list = votes
        .map((v) => `- **${v.election_title}** — ${new Date(v.voted_at).toLocaleString()} (IP: ${v.ip_address || "unknown"})`)
        .join("\n");
      return `📋 **5 Most Recent Votes:**\n\n${list}`;
    }

    case "fraud_alerts": {
      const alerts = await fetchSuspiciousActivity();
      if (!alerts.length)
        return `✅ **No suspicious activity detected** in the last hour. All voting patterns look normal.`;
      const list = alerts
        .map((a) => `- IP \`${a.ip_address}\` — **${a.vote_count} votes** in the last hour ⚠️`)
        .join("\n");
      return `🚨 **Suspicious Activity Detected:**\n\n${list}\n\n> These IPs have exceeded the normal voting threshold. Consider reviewing the Audit Logs for more details.`;
    }

    default:
      return `🤔 I'm not sure how to help with that. Here are some things I can do:\n\n${
        role === "voter"
          ? '- "How do I vote?"\n- "Is my vote counted?"\n- "When are results out?"\n- "What is OTP?"'
          : '- "Show turnout today"\n- "Active elections"\n- "Top candidates"\n- "Fraud alerts"'
      }`;
  }
};

// ─────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────
export const processMessage = async (message, user) => {
  try {
    const intent = detectIntent(message, user.role);
    logger.info(`ChatBot: user=${user.id} role=${user.role} intent=${intent} msg="${message}"`);
    const response = await generateResponse(intent, user.role, user.name);
    return { response, intent };
  } catch (error) {
    logger.error(`ChatBot error: ${error.message}`);
    return {
      response: "⚠️ Sorry, I encountered an issue processing your request. Please try again.",
      intent: "error",
    };
  }
};
