import { useEffect } from 'react';

function Modal({ title, children, onClose, size }) {

    useEffect(function() {
        function handleKeyDown(event) {
            if (event.key === 'Escape') {
                onClose();
            }
        }

        document.addEventListener('keydown', handleKeyDown);

        return function() {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div className="modal-overlay">

            <div className={'modal-container ' + (size || '')}>

                <div className="modal-header">
                    <h2>{title}</h2>

                    <button
                        type="button"
                        className="modal-close"
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {children}
                </div>

            </div>

        </div>
    );
}

export default Modal;