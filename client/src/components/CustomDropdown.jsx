import { useState, useRef, useEffect } from "react";
import { HiOutlineChevronDown } from "react-icons/hi";
import "./CustomDropdown.css";

// Custom dropdown component with glassmorphism styling
export default function CustomDropdown({
  options = [],
  value,
  onChange,
  name = "dropdown",
  icon,
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value) ||
    options[0] || { label: "Select..." };

  return (
    <div
      className={`custom-dropdown-wrapper ${className} ${isOpen ? "is-open" : ""}`}
      ref={dropdownRef}
    >
      <button
        type="button"
        className="custom-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="dropdown-trigger-content">
          {icon && <span className="dropdown-icon">{icon}</span>}
          {selectedOption.label}
        </span>
        <HiOutlineChevronDown
          className={`dropdown-chevron ${isOpen ? "open" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="custom-dropdown-menu animate-scaleIn">
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`custom-dropdown-item ${opt.value === value ? "selected" : ""}`}
              onClick={() => {
                onChange({ target: { name, value: opt.value } });
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
