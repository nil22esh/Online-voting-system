import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineExclamation, HiOutlineX } from "react-icons/hi";
import "./ConfirmModal.css";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Are you sure?", 
  message = "This action cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger", // danger, warning, info
  singleButton = false
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          className="modal-content confirm-modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="confirm-modal-header">
            <div className={`confirm-modal-icon-wrap ${type}`}>
              <HiOutlineExclamation />
            </div>
            <button className="confirm-modal-close" onClick={onClose}>
              <HiOutlineX />
            </button>
          </div>

          <div className="confirm-modal-body">
            <h2 className="confirm-modal-title">{title}</h2>
            <p className="confirm-modal-message">{message}</p>
          </div>

          <div className="confirm-modal-footer" style={singleButton ? { gridTemplateColumns: "1fr" } : {}}>
            {!singleButton && (
              <button 
                className="btn btn-secondary confirm-modal-btn" 
                onClick={onClose}
              >
                {cancelText}
              </button>
            )}
            <button 
              className={`btn ${type === "danger" ? "btn-danger" : "btn-primary"} confirm-modal-btn`} 
              onClick={() => {
                onConfirm && onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ConfirmModal;
