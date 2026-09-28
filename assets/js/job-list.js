document.addEventListener("DOMContentLoaded", () => {
    loadJobList();
});

async function loadJobList() {
    try {
        const params = new URLSearchParams(window.location.search);
        const version = params.get("v") || "7.5";
        const jsonPath = `data/skills-v${version}.json`; // 💡 パスを調整

        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        const jobsData = data.jobs || data;

        const containers = {
            Tank: document.getElementById("tank-list"),
            Healer: document.getElementById("healer-list"),
            Melee: document.getElementById("melee-list"),
            Ranged: document.getElementById("ranged-list"),
            Caster: document.getElementById("caster-list")
        };

        Object.values(containers).forEach(el => {
            if (el) el.innerHTML = "";
        });

        Object.keys(jobsData).forEach(key => {
            const job = jobsData[key];

            const link = document.createElement("a");
            // 💡 job-detail.html へパッチバージョンとジョブIDを引き継ぐ
            link.href = `job-detail.html?v=${version}&job=${key}`;
            link.className = "job-card";

            const iconImg = `<img src="assets/images/icons/${key}.png" class="job-icon" alt="" onerror="this.style.display='none'">`;
            link.innerHTML = `${iconImg}<span class="job-name">${escapeHtml(job.name)}</span>`;

            const div = document.createElement("div");
            div.className = "job-card-wrapper";
            div.appendChild(link);

            const targetContainer = containers[job.role];
            if (targetContainer) {
                targetContainer.appendChild(div);
            }
        });

    } catch (err) {
        console.error("ジョブ一覧の取得に失敗しました:", err);
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}