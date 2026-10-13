async function searchCase() {

    const survey = document.getElementById("survey").value.trim();

    const resultDiv = document.getElementById("result");

    resultDiv.innerHTML = `
        <div class="loading-box">
            <div class="loader"></div>
            <h3>Searching Court Records...</h3>
        </div>
    `;

    const response = await fetch("http://localhost:5000/api/land");
    const data = await response.json();

    const land = data.find(item =>
        item.survey_number.toLowerCase() === survey.toLowerCase()
    );

    if (land) {

        let color = "green";

        if (land.status === "Pending") color = "orange";
        if (land.status === "Rejected") color = "red";

        resultDiv.innerHTML = `

        <div class="verify-box">

        <h2>⚖ Court Case Details</h2>

        <p><b>Owner Name :</b> ${land.owner_name}</p>

        <p><b>Survey Number :</b> ${land.survey_number}</p>

        <p><b>District :</b> ${land.district}</p>

        <p><b>Village :</b> ${land.village}</p>

        <hr>

        <p><b>Case Number :</b>
        ${land.case_number ?? "No Case"}
        </p>

        <p><b>Court :</b>
        ${land.court_name ?? "-"}
        </p>

        <p><b>Case Type :</b>
        ${land.case_type ?? "-"}
        </p>

        <p>

        <b>Status :</b>

        <span style="color:${color};font-weight:bold">

        ${land.status}

        </span>

        </p>

        </div>

        `;

    } else {

        resultDiv.innerHTML = `

        <div class="verify-box">

        <h3 style="color:red">

        ❌ No Record Found

        </h3>

        </div>

        `;

    }

}