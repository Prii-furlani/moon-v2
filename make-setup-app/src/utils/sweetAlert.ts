import Swal from 'sweetalert2';

// Custom SweetAlert2 Toast configuration matching 60-30-10 palette
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showToastSuccess = (title: string) => {
  Toast.fire({
    icon: 'success',
    title
  });
};

export const showToastInfo = (title: string) => {
  Toast.fire({
    icon: 'info',
    title
  });
};

export const showToastError = (title: string) => {
  Toast.fire({
    icon: 'error',
    title
  });
};

export const showAlertSuccess = (title: string, text?: string) => {
  Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#873F2B',
    confirmButtonText: 'Entendido'
  });
};

export const confirmDelete = async (title: string, text: string, onConfirm: () => void) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#BC473A',
    cancelButtonColor: '#7D916E',
    confirmButtonText: 'Sim, excluir!',
    cancelButtonText: 'Cancelar',
    reverseButtons: true
  });

  if (result.isConfirmed) {
    onConfirm();
    Toast.fire({
      icon: 'success',
      title: 'Item excluído com sucesso!'
    });
  }
};
