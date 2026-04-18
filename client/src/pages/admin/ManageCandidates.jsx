import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllElections } from "../../api/election.api";
import {
  getCandidatesByElection,
  addCandidate,
  updateCandidate,
  deleteCandidate,
} from "../../api/candidate.api";
import Sidebar from "../../components/Sidebar";
import ConfirmModal from "../../components/ConfirmModal";
import CustomDropdown from "../../components/CustomDropdown";
import { HiOutlineUpload, HiOutlineTrash, HiOutlinePencil, HiOutlinePlus } from "react-icons/hi";
import "./Admin.css";
import defaultAvatar from "../../assets/default-avatar.png";

export default function ManageCandidates() {
  const { showToast } = useAuth();
  const fileInputRef = useRef(null);
  const symbolInputRef = useRef(null);
  const [elections, setElections] = useState([]);
  const [selectedElection, setSelectedElection] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    party_name: "",
    party_symbol: "",
    party_symbol_file: null,
    party_symbol_preview: "",
    age: "",
    gender: "",
    education: "",
    profession: "",
    experience_years: "",
    bio: "",
    manifesto: [""],
    social_links: {
      website: "",
      twitter: "",
      linkedin: ""
    },
    photo: null,
    photo_preview: "",
  });

  useEffect(() => {
    getAllElections()
      .then((res) => setElections(res.data.data))
      .catch(() => showToast("error", "Failed to load elections"));
  }, []);

  useEffect(() => {
    if (selectedElection) fetchCandidates();
  }, [selectedElection]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await getCandidatesByElection(selectedElection);
      setCandidates(res.data.data);
    } catch { showToast("error", "Failed to load candidates"); }
    finally { setLoading(false); }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo" || name === "party_symbol_file") {
      const file = files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          showToast("error", "Image size should be less than 2MB");
          return;
        }
        setFormData({
          ...formData,
          [name]: file,
          [name === "photo" ? "photo_preview" : "party_symbol_preview"]: URL.createObjectURL(file),
        });
      }
    } else if (name.startsWith("social_")) {
      const field = name.split("_")[1];
      setFormData({
        ...formData,
        social_links: {
          ...formData.social_links,
          [field]: value
        }
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleManifestoChange = (index, value) => {
    const newManifesto = [...formData.manifesto];
    newManifesto[index] = value;
    setFormData({ ...formData, manifesto: newManifesto });
  };

  const addManifestoItem = () => {
    setFormData({ ...formData, manifesto: [...formData.manifesto, ""] });
  };

  const removeManifestoItem = (index) => {
    const newManifesto = formData.manifesto.filter((_, i) => i !== index);
    setFormData({ ...formData, manifesto: newManifesto.length ? newManifesto : [""] });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      party_name: "",
      party_symbol: "",
      party_symbol_file: null,
      party_symbol_preview: "",
      age: "",
      gender: "",
      education: "",
      profession: "",
      experience_years: "",
      bio: "",
      manifesto: [""],
      social_links: {
        website: "",
        twitter: "",
        linkedin: ""
      },
      photo: null,
      photo_preview: "",
    });
    setEditingId(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("party_name", formData.party_name || "");
      if (formData.party_symbol_file) {
        data.append("party_symbol_file", formData.party_symbol_file);
      } else {
        data.append("party_symbol", formData.party_symbol || "");
      }
      data.append("age", formData.age || "");
      data.append("gender", formData.gender || "");
      data.append("education", formData.education || "");
      data.append("profession", formData.profession || "");
      data.append("experience_years", formData.experience_years || "");
      data.append("bio", formData.bio || "");
      data.append("manifesto", JSON.stringify(formData.manifesto.filter(item => item.trim() !== "")));
      data.append("social_links", JSON.stringify(formData.social_links));
      
      if (formData.photo) {
        data.append("photo", formData.photo);
      }
      
      if (editingId) {
        await updateCandidate(editingId, data);
        showToast("success", "Candidate updated");
      } else {
        data.append("election_id", selectedElection);
        await addCandidate(data);
        showToast("success", "Candidate added");
      }
      resetForm();
      fetchCandidates();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Operation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (c) => {
    setFormData({ 
      name: c.name, 
      party_name: c.party_name || "", 
      party_symbol: c.party_symbol || "",
      party_symbol_file: null,
      party_symbol_preview: c.party_symbol || "",
      age: c.age || "",
      gender: c.gender || "",
      education: c.education || "",
      profession: c.profession || "",
      experience_years: c.experience_years || "",
      bio: c.bio || "", 
      manifesto: (c.manifesto && c.manifesto.length) ? c.manifesto : [""],
      social_links: c.social_links || { website: "", twitter: "", linkedin: "" },
      photo: null, 
      photo_preview: c.photo_url || "" 
    });
    setEditingId(c.id);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setCandidateToDelete(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!candidateToDelete) return;
    try {
      await deleteCandidate(candidateToDelete);
      showToast("success", "Candidate deleted");
      fetchCandidates();
    } catch (err) {
      showToast("error", err.response?.data?.message || "Delete failed");
    } finally {
      setCandidateToDelete(null);
    }
  };

  return (
    <div className="layout">
      <Sidebar />
      <main className="layout-main">
        <div className="page-header flex justify-between items-center">
          <div>
            <h1 className="page-title">Manage Candidates</h1>
            <p className="page-subtitle">Add and manage candidates for elections</p>
          </div>
          {selectedElection && (
            <button className="btn btn-primary flex items-center gap-xs" onClick={() => { resetForm(); setShowModal(true); }}>
              <HiOutlinePlus /> Add Candidate
            </button>
          )}
        </div>

        {/* Election Selector */}
        <div className="glass-card mb-lg" style={{ zIndex: 10 }}>
          <label className="form-label">Select Election</label>
          <CustomDropdown
            value={selectedElection}
            onChange={(e) => setSelectedElection(e.target.value)}
            options={[
              { value: "", label: "-- Choose an election --" },
              ...elections.map((el) => ({
                value: el.id,
                label: `${el.title} (${el.status})`
              }))
            ]}
          />
        </div>

        {!selectedElection ? (
          <div className="glass-card text-center" style={{ padding: "3rem" }}>
            <p style={{ color: "var(--text-secondary)" }}>Select an election to manage its candidates</p>
          </div>
        ) : loading ? (
          <div className="loading-container"><div className="spinner"></div></div>
        ) : candidates.length === 0 ? (
          <div className="glass-card text-center" style={{ padding: "3rem" }}>
            <p style={{ color: "var(--text-secondary)" }}>No candidates yet. Add the first one!</p>
          </div>
        ) : (
          <div className="candidate-list">
            {candidates.map((c) => (
              <div key={c.id} className="glass-card candidate-row-card">
                <img
                  src={c.photo_url || defaultAvatar}
                  alt={c.name}
                  className="candidate-row-avatar"
                />
                <div className="candidate-row-info">
                  <span className="candidate-row-name">{c.name}</span>
                  <span className="candidate-party">{c.party_name || "Independent"}</span>
                </div>
                <span className="candidate-row-votes">{c.vote_count || 0} votes</span>
                <div className="flex gap-sm">
                  <button className="btn btn-icon btn-secondary" onClick={() => handleEdit(c)} title="Edit">
                    <HiOutlinePencil />
                  </button>
                  <button className="btn btn-icon btn-danger" onClick={() => handleDelete(c.id)} title="Delete">
                    <HiOutlineTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px", width: "90%" }}>
              <h2 className="modal-title">{editingId ? "Edit Candidate" : "Add Candidate"}</h2>
              <form onSubmit={handleSubmit} className="candidate-form-scrollable">
                <div className="form-grid">
                  <div className="form-left-col">
                    <div className="candidate-photo-upload-section">
                      <div 
                        className="photo-preview-container" 
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {formData.photo_preview ? (
                          <img src={formData.photo_preview} alt="Preview" className="photo-preview-img" />
                        ) : (
                          <div className="photo-placeholder">
                            <HiOutlineUpload size={32} />
                            <span>Upload Photo</span>
                          </div>
                        )}
                      </div>
                      <input 
                        type="file" 
                        name="photo" 
                        ref={fileInputRef}
                        onChange={handleChange} 
                        hidden 
                        accept="image/*"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Name</label>
                      <input name="name" className="form-input" value={formData.name} onChange={handleChange} required placeholder="Candidate name" />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Party Name</label>
                        <input name="party_name" className="form-input" value={formData.party_name} onChange={handleChange} placeholder="Party name" />
                      </div>
                      <div className="form-group party-symbol-group">
                        <label className="form-label">Party Symbol</label>
                        <div 
                          className="symbol-preview-container" 
                          onClick={() => symbolInputRef.current?.click()}
                        >
                          {formData.party_symbol_preview ? (
                            <img src={formData.party_symbol_preview} alt="Symbol Preview" className="symbol-preview-img" />
                          ) : (
                            <div className="photo-placeholder">
                              <HiOutlineUpload size={24} />
                              <span>Upload</span>
                            </div>
                          )}
                        </div>
                        <input 
                          type="file" 
                          name="party_symbol_file" 
                          ref={symbolInputRef}
                          onChange={handleChange} 
                          hidden 
                          accept="image/*"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Age</label>
                        <input type="number" name="age" className="form-input" value={formData.age} onChange={handleChange} placeholder="Age" min="18" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select name="gender" className="form-input" value={formData.gender} onChange={handleChange}>
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Education</label>
                      <input name="education" className="form-input" value={formData.education} onChange={handleChange} placeholder="Highest qualification" />
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Profession</label>
                        <input name="profession" className="form-input" value={formData.profession} onChange={handleChange} placeholder="Current profession" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Experience (Years)</label>
                        <input name="experience_years" className="form-input" value={formData.experience_years} onChange={handleChange} placeholder="e.g. 10 years" />
                      </div>
                    </div>
                  </div>

                  <div className="form-right-col">
                    <div className="form-group">
                      <label className="form-label">Bio</label>
                      <textarea 
                        name="bio" 
                        className="form-input" 
                        value={formData.bio} 
                        onChange={handleChange} 
                        placeholder="Short bio" 
                        rows="3"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label flex justify-between items-center">
                        Manifesto Points
                        <button type="button" className="btn btn-sm btn-secondary" onClick={addManifestoItem}>
                          <HiOutlinePlus /> Add Point
                        </button>
                      </label>
                      <div className="manifesto-list">
                        {formData.manifesto.map((item, index) => (
                          <div key={index} className="manifesto-item-input flex gap-xs mb-xs">
                            <input 
                              className="form-input" 
                              value={item} 
                              onChange={(e) => handleManifestoChange(index, e.target.value)} 
                              placeholder={`Point ${index + 1}`}
                            />
                            <button 
                              type="button" 
                              className="btn btn-icon btn-danger-soft" 
                              onClick={() => removeManifestoItem(index)}
                              disabled={formData.manifesto.length === 1 && !item}
                            >
                              <HiOutlineTrash />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Social Links</label>
                      <div className="social-links-grid">
                        <input name="social_website" className="form-input mb-xs" value={formData.social_links.website} onChange={handleChange} placeholder="Website URL" />
                        <input name="social_twitter" className="form-input mb-xs" value={formData.social_links.twitter} onChange={handleChange} placeholder="Twitter/X URL" />
                        <input name="social_linkedin" className="form-input" value={formData.social_links.linkedin} onChange={handleChange} placeholder="LinkedIn URL" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="modal-actions mt-lg">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? "Saving..." : (editingId ? "Update Candidate" : "Add Candidate")}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={showConfirmDelete}
          onClose={() => setShowConfirmDelete(false)}
          onConfirm={confirmDelete}
          title="Delete Candidate"
          message="Are you sure you want to delete this candidate? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </main>
    </div>
  );
}
