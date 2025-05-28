console.log("Admin panel loaded.");
if (!localStorage.getItem("token")) {
  alert("You must log in first.");
  window.location.href = "/landing/index.html"; // or login page
}
const token = localStorage.getItem("token");

fetch('/api/users', {
  headers: {
    Authorization: token
  }
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('Unauthorized', err));
if (!localStorage.getItem("token")) {
  alert("Please log in first.");
  window.location.href = "/landing/index.html";
}
