
async function addRecord() {
    const district = document.getElementById("district").value;
    const taluk = document.getElementById("taluk").value;
    const village = document.getElementById("village").value;
    const survey = document.getElementById("survey").value;
    const owner = document.getElementById("owner").value;
    const patta = document.getElementById("patta").value;
    const area = document.getElementById("area").value;
    const landType = document.getElementById("landType").value;

    // Login pannumbodhu save aana token
    const token = localStorage.getItem("token");

    if (!token) {
        document.getElementById("message").textContent =
            "Please login first.";
        return;
    }

    const response = await fetch("http://localhost:5000/api/add-land", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
    district,
    taluk,
    village,
    survey,
    owner,
    patta,
    area,
    landType
})
    });

    const data = await response.json();

    document.getElementById("message").textContent =
        data.message || data.error || "Request completed.";
}
