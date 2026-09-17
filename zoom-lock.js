// Prevent accidental browser zoom while keeping normal page scrolling enabled.
document.addEventListener('wheel', (event) => {
  if (event.ctrlKey || event.metaKey) event.preventDefault();
}, { passive: false });

document.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && ['+', '=', '-'].includes(event.key)) event.preventDefault();
});

document.addEventListener('gesturestart', (event) => event.preventDefault(), { passive: false });
