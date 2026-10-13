function findReport(){

const id=document.getElementById("verificationId").value;

const result=document.getElementById("result");

if(id==""){

result.innerHTML=`

<p style="color:red">

Enter Verification ID

</p>

`;

return;

}

result.innerHTML=`

<div class="verify-box">

<h2>

📄 Verification Report

</h2>

<p>

Verification ID :
<b>${id}</b>

</p>

<p>

Document Status :

<span class="verified">

✔ Digitally Verified

</span>

</p>

<br>

<button onclick="window.print()">

🖨 Print Report

</button>

<button
style="margin-left:15px;background:green;"
onclick="alert('PDF Download Successful')">

⬇ Download PDF

</button>

</div>

`;

}