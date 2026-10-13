async function analyzeLand() {

    const survey = document.getElementById("survey").value;

    const response = await fetch("http://localhost:5000/api/land");

    const data = await response.json();

    const land = data.find(item => item.survey_number === survey);

    if (!land) {

        alert("No Record Found");

        return;

    }

    const aiResponse = await fetch("http://localhost:5000/api/ai-check", {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify(land)

    });

    const aiData = await aiResponse.json();

    const text = aiData.choices[0].message.content;

    let risk = "Low";

    if (text.toLowerCase().includes("high"))
        risk = "High";

    else if (text.toLowerCase().includes("medium"))
        risk = "Medium";

    document.getElementById("aiReport").style.display = "block";

    document.getElementById("riskBadge").innerHTML = risk;

    document.getElementById("reasonText").innerHTML = text;

    document.getElementById("recommendationText").innerHTML =
        "Verify EC, Patta and Court Records before registration.";

    document.getElementById("confidenceBar").style.width = "96%";

    document.getElementById("confidenceText").innerHTML = "96%";

    document.getElementById("generatedTime").innerHTML =
        new Date().toLocaleString();

    let badge = document.getElementById("riskBadge");

    badge.className = "risk-badge";

    if (risk == "Low") {

        badge.classList.add("low");

    }

    else if (risk == "Medium") {

        badge.classList.add("medium");

    }

    else {

        badge.classList.add("high");

    }

}