
async function saveSearchHistory(district, taluk, village, survey, resultFound) {
    const token = localStorage.getItem("token");

    // Login pannadha user-ku history save panna mudiyadhu
    if (!token) {
        console.log("Login required to save search history.");
        return;
    }

    try {
        const response = await fetch(
            "http://localhost:5000/api/search-history",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
               
body: JSON.stringify({
    district: district,
    taluk: taluk,
    village: village,
    survey_number: survey,
    result_found: resultFound
})

            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Search history save failed:", data.message);
            return;
        }

        console.log("Search history saved successfully.");
    } catch (error) {
        console.error("Search history error:", error);
    }
}


async function searchLand() {
    const district = document.getElementById("district").value.trim().toLowerCase();
    
const taluk = document.getElementById("taluk").value.trim().toLowerCase();

    const village = document.getElementById("village").value.trim().toLowerCase();
    const survey = document.getElementById("survey").value.trim();

    const resultDiv = document.getElementById("result");
    const searchBtn = document.querySelector(".container button");

    resultDiv.innerHTML = `
        <div class="loading-box">
            <div class="loader"></div>
            <h3>Searching Land Records...</h3>
            <p>தகவல்கள் தேடப்படுகிறது. தயவுசெய்து காத்திருக்கவும்...</p>
        </div>
    `;

    if (searchBtn) {
        searchBtn.disabled = true;
        searchBtn.innerHTML = "Searching...";
    }

    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await fetch("http://localhost:5000/api/land");

        if (!response.ok) {
            throw new Error("Unable to fetch land records");
        }

        const data = await response.json();

        
const land = data.find(item =>
    String(item.survey_number).trim() === survey &&
    String(item.district || "").trim().toLowerCase() === district &&
    String(item.village || "").trim().toLowerCase() === village &&
    (
        !taluk ||
        String(item.taluk || "").trim().toLowerCase() === taluk
    )
);

await saveSearchHistory(district, taluk, village, survey, Boolean(land));
       
if (!land) {
    await saveSearchHistory(district, village, survey, false);

    resultDiv.innerHTML = `
        <p style="color:red;">
            No Record Found / பதிவு கிடைக்கவில்லை
        </p>
    `;
    return;
}


        let statusColor = "green";

        if (land.status === "Rejected") {
            statusColor = "red";
        } else if (land.status === "Pending") {
            statusColor = "orange";
        }

        resultDiv.innerHTML = `
            <div class="result-card">

                <div class="report-header">
                    <div>
                        <h2>
                            📋 Land Verification Report /
                            நில சரிபார்ப்பு அறிக்கை
                        </h2>
                        <p class="gov-name">
                            Academic Demo Dataset<br>
                            கல்வி நோக்கத்திற்கான மாதிரி தரவு
                        </p>
                    </div>

                    <img
                        src="assets/qr.png"
                        class="qr-code"
                        alt="Demo QR Code"
                    >
                </div>

                <table class="result-table">
                    <tr>
                        <td>👤 Owner Name / உரிமையாளர் பெயர்</td>
                        <td>${land.owner_name ?? "N/A"}</td>
                    </tr>
                    <tr>
                        <td>📍 District / மாவட்டம்</td>
                        <td>${land.district ?? "N/A"}</td>
                    </tr>
                    <tr>
                        <td>🏡 Village / கிராமம்</td>
                        <td>${land.village ?? "N/A"}</td>
                    </tr>
                    <tr>
                        <td>📑 Survey Number / சர்வே எண்</td>
                        <td>${land.survey_number ?? "N/A"}</td>
                    </tr>
                    <tr>
                        <td>📝 Patta Number / பட்டா எண்</td>
                        <td>${land.patta_number ?? "N/A"}</td>
                    </tr>
                    <tr>
                        <td>🌾 Land Area / நில அளவு</td>
                        <td>${land.land_area ?? "N/A"}</td>
                    </tr>
                    <tr>
                        <td>🏞 Land Type / நில வகை</td>
                        <td>${land.land_type ?? "N/A"}</td>
                    </tr>
                </table>

                ${
                    land.case_number
                        ? `
                            <div class="result-row">
                                <span class="result-label">
                                    ⚖ Case Number / வழக்கு எண்
                                </span>
                                <span class="result-value">
                                    ${land.case_number}
                                </span>
                            </div>

                            <div class="result-row">
                                <span class="result-label">
                                    🏛 Court Name / நீதிமன்றம்
                                </span>
                                <span class="result-value">
                                    ${land.court_name ?? "N/A"}
                                </span>
                            </div>

                            <div class="result-row">
                                <span class="result-label">
                                    📂 Case Type / வழக்கு வகை
                                </span>
                                <span class="result-value">
                                    ${land.case_type ?? "N/A"}
                                </span>
                            </div>
                        `
                        : `
                            <div class="safe-badge">
                                No Litigation Record Found in Demo Dataset /
                                மாதிரி தரவில் வழக்கு பதிவு இல்லை
                            </div>
                        `
                }

                <div class="result-row">
                    <span class="result-label">
                        📌 Status / நிலை
                    </span>
                    <span
                        class="result-value"
                        style="color:${statusColor};font-weight:bold;"
                    >
                        ${land.status ?? "N/A"}
                    </span>
                </div>

                <div class="verify-box">
                    <h3>
                        Verification Details / சரிபார்ப்பு விவரங்கள்
                    </h3>

                    <p>
                        <b>Verification ID / சரிபார்ப்பு எண்:</b>
                        LV-${land.id}
                    </p>

                    <p>
                        <b>Report Generated On / அறிக்கை உருவாக்கப்பட்ட தேதி:</b>
                        ${new Date().toLocaleString()}
                    </p>

                    <p>
                        <b>Document Status / ஆவண நிலை:</b>
                        Academic Demo Report — Not Officially Verified
                    </p>
                </div>

                <button
                    type="button"
                    class="ai-btn"
                    id="analyzeRiskBtn"
                >
                    🤖 AI Risk Analysis / AI அபாய பகுப்பாய்வு
                </button>

                <div id="aiResult"></div>
            </div>
        `;

        const aiButton = document.getElementById("analyzeRiskBtn");

        aiButton.addEventListener("click", () => analyzeRisk(land));

    } catch (error) {
        console.error("Land search failed:", error);

        resultDiv.innerHTML = `
            <p style="color:red;">
                Unable to search land records. Please check the backend server.
            </p>
        `;
    } finally {
        if (searchBtn) {
            searchBtn.disabled = false;
            searchBtn.innerHTML = "Search / தேடு";
        }
    }
}


async function analyzeRisk(land) {
    const aiDiv = document.getElementById("aiResult");

    if (!aiDiv) {
        return;
    }

    aiDiv.innerHTML = `
        <p style="color:blue;">
            AI analyzing land risk...
        </p>
    `;

    try {
        const response = await fetch("http://localhost:5000/api/ai-check", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(land)
        });

        if (!response.ok) {
            throw new Error("AI analysis request failed");
        }

        const data = await response.json();
        const aiText = data.choices?.[0]?.message?.content;

        if (!aiText) {
            throw new Error("AI response content is missing");
        }

        const lines = aiText
            .split("\n")
            .filter(line => line.trim() !== "");

        const risk = lines[0] || "Risk level unavailable";
        const reason = lines[1] || "Reason unavailable";
        const recommendation = lines.slice(2).join("\n") ||
            "Please consult the relevant authorities.";

        const escapeHTML = value =>
            String(value).replace(/[&<>"']/g, char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            })[char]);

        aiDiv.innerHTML = `
            <div class="ai-box">
                <h2>
                    AI Litigation Analysis / AI அபாய பகுப்பாய்வு
                </h2>

                <div class="ai-report">
                    <h3>🟢 Risk Level / அபாய நிலை</h3>
                    <p>${escapeHTML(risk)}</p>

                    <hr>

                    <h3>📝 Reason / காரணம்</h3>
                    <p>${escapeHTML(reason)}</p>

                    <hr>

                    <h3>💡 Recommendation / பரிந்துரை</h3>
                    <p>${escapeHTML(recommendation).replace(/\n/g, "<br>")}</p>
                </div>
            </div>
        `;

    } catch (error) {
        console.error("AI analysis failed:", error);

        aiDiv.innerHTML = `
            <p style="color:red;">
                AI Analysis Failed. Please try again.
            </p>
        `;
    }
}



async function downloadVerificationPDF() {
    const report = document.querySelector(".result-card");

    if (!report || !report.innerText.trim()) {
        alert("First search for a land record.");
        return;
    }

    if (typeof html2canvas === "undefined") {
        alert("html2canvas library is not loaded.");
        return;
    }

    if (typeof html2pdf === "undefined") {
        alert("html2pdf library is not loaded.");
        return;
    }

    const button = document.getElementById("downloadPdfBtn");

    try {
        if (button) {
            button.disabled = true;
            button.innerText = "Generating PDF...";
        }

        // Capture the original report before changing its layout.
        const canvas = await html2canvas(report, {
            scale: 2,
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: true,
            scrollX: 0,
            scrollY: 0
        });

        console.log(
            "PDF test canvas:",
            canvas.width,
            "x",
            canvas.height
        );

        if (canvas.width === 0 || canvas.height === 0) {
            throw new Error("Captured report has zero dimensions.");
        }

        // Convert the captured image into a PDF.
        const imageData = canvas.toDataURL("image/jpeg", 0.95);

        const pdf = new window.jspdf.jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;

        const imageWidth = pageWidth - margin * 2;
        const imageHeight =
            (canvas.height * imageWidth) / canvas.width;

        let remainingHeight = imageHeight;
        let position = margin;

        pdf.addImage(
            imageData,
            "JPEG",
            margin,
            position,
            imageWidth,
            imageHeight
        );

        remainingHeight -= pageHeight - margin * 2;

        while (remainingHeight > 0) {
            position = margin - (imageHeight - remainingHeight);
            pdf.addPage();

            pdf.addImage(
                imageData,
                "JPEG",
                margin,
                position,
                imageWidth,
                imageHeight
            );

            remainingHeight -= pageHeight - margin * 2;
        }

        pdf.save("Land_Verification_Report.pdf");

    } catch (error) {
        console.error("PDF generation failed:", error);
        alert("PDF generation failed. Please check the Console.");
    } finally {
        if (button) {
            button.disabled = false;
            button.innerText = "Download PDF / PDF பதிவிறக்கம்";
        }
    }
}
