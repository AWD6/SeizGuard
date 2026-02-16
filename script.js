document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    console.log('Login attempted with:', username);
    alert('This is a static demo. In the full app, this would connect to the backend.');
});
