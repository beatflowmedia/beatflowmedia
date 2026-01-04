// src/context/ModalContext.js
// Centralized modal context for consistent alert/confirm/prompt dialogs
import { createContext, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TextField,
  Box,
  IconButton
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Info,
  Close
} from '@mui/icons-material';

export const ModalContext = createContext();

export function ModalProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'alert', // 'alert' | 'confirm' | 'prompt'
    variant: 'info', // 'info' | 'success' | 'warning' | 'error'
    title: '',
    message: '',
    defaultValue: '',
    resolve: null
  });

  const [inputValue, setInputValue] = useState('');

  const showAlert = useCallback((title, message, variant = 'info') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'alert',
        variant,
        title,
        message,
        defaultValue: '',
        resolve
      });
    });
  }, []);

  const showConfirm = useCallback((title, message, variant = 'warning') => {
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'confirm',
        variant,
        title,
        message,
        defaultValue: '',
        resolve
      });
    });
  }, []);

  const showPrompt = useCallback((title, message, defaultValue = '', variant = 'info') => {
    setInputValue(defaultValue);
    return new Promise((resolve) => {
      setModalState({
        isOpen: true,
        type: 'prompt',
        variant,
        title,
        message,
        defaultValue,
        resolve
      });
    });
  }, []);

  const handleClose = useCallback((result) => {
    if (modalState.resolve) {
      if (modalState.type === 'prompt') {
        modalState.resolve(result ? inputValue : null);
      } else {
        modalState.resolve(result);
      }
    }
    setModalState({
      isOpen: false,
      type: 'alert',
      variant: 'info',
      title: '',
      message: '',
      defaultValue: '',
      resolve: null
    });
    setInputValue('');
  }, [modalState, inputValue]);

  const getIcon = () => {
    const iconProps = { sx: { fontSize: 48, mb: 2 } };
    switch (modalState.variant) {
      case 'success':
        return <CheckCircle {...iconProps} sx={{ ...iconProps.sx, color: '#1DB954' }} />;
      case 'error':
        return <Error {...iconProps} sx={{ ...iconProps.sx, color: '#f44336' }} />;
      case 'warning':
        return <Warning {...iconProps} sx={{ ...iconProps.sx, color: '#ff9800' }} />;
      case 'info':
      default:
        return <Info {...iconProps} sx={{ ...iconProps.sx, color: '#2196f3' }} />;
    }
  };

  const getButtonColor = () => {
    switch (modalState.variant) {
      case 'success':
        return '#1DB954';
      case 'error':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
      default:
        return '#2196f3';
    }
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}

      {/* UniversalModal Component */}
      <Dialog
        open={modalState.isOpen}
        onClose={() => modalState.type === 'alert' ? handleClose(true) : handleClose(false)}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            minWidth: 400,
            maxWidth: 500
          }
        }}
      >
        <DialogTitle
          id="modal-title"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
            color: 'text.primary',
            fontWeight: 'bold'
          }}
        >
          {modalState.title}
          <IconButton
            aria-label="close"
            onClick={() => handleClose(false)}
            sx={{ color: 'text.secondary' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 2 }}>
            {getIcon()}
            <DialogContentText
              id="modal-description"
              sx={{ color: 'text.secondary', mb: modalState.type === 'prompt' ? 2 : 0 }}
            >
              {modalState.message}
            </DialogContentText>

            {modalState.type === 'prompt' && (
              <TextField
                autoFocus
                fullWidth
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleClose(true);
                  }
                }}
                variant="outlined"
                sx={{
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    color: 'text.primary',
                    '& fieldset': {
                      borderColor: 'grey.700'
                    },
                    '&:hover fieldset': {
                      borderColor: getButtonColor()
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: getButtonColor()
                    }
                  }
                }}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          {modalState.type === 'alert' && (
            <Button
              onClick={() => handleClose(true)}
              variant="contained"
              sx={{
                bgcolor: getButtonColor(),
                '&:hover': {
                  bgcolor: getButtonColor(),
                  opacity: 0.9
                },
                minWidth: 100
              }}
            >
              OK
            </Button>
          )}

          {(modalState.type === 'confirm' || modalState.type === 'prompt') && (
            <>
              <Button
                onClick={() => handleClose(false)}
                variant="outlined"
                sx={{
                  borderColor: 'grey.700',
                  color: 'text.secondary',
                  '&:hover': {
                    borderColor: 'grey.600',
                    bgcolor: 'rgba(255, 255, 255, 0.05)'
                  },
                  minWidth: 100
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleClose(true)}
                variant="contained"
                sx={{
                  bgcolor: getButtonColor(),
                  '&:hover': {
                    bgcolor: getButtonColor(),
                    opacity: 0.9
                  },
                  minWidth: 100
                }}
              >
                {modalState.type === 'confirm' ? 'Confirm' : 'OK'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </ModalContext.Provider>
  );
}
