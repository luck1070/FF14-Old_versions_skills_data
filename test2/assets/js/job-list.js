document.addEventListener("DOMContentLoaded", () => {
    loadJobList();
});

async function loadJobList() {
    try {
        const res = await fetch("data/skills.json");
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();

        const tank = document.getElementById("tank-list");
        const healer = document.getElementById("healer-list");
        const melee = document.getElementById("melee-list");
        const ranged = document.getElementById("ranged-list");
        const caster = document.getElementById("caster-list");

        // リストの初期化
        [tank, healer, melee, ranged, caster].forEach(el => {
            if (el) el.innerHTML = "";
        });

        Object.keys(data).forEach(key => {
            const job = data[key];

            const link = document.createElement("a");
            link.href = `job-detail.html?job=${key}`;
            link.className = "job-card";
            link.textContent = job.name;

            const div = document.createElement("div");
            div.appendChild(link);

            const role = (job.role || job.class || "").toLowerCase();

            // 振り分け処理
            if (role === "tank" || role === "タンク") {
                if (tank) tank.appendChild(div);
            } else if (role === "healer" || role === "ヒーラー" || role === "ヒラ") {
                if (healer) healer.appendChild(div);
            } else if (role === "melee" || role === "近接dps") {
                if (melee) melee.appendChild(div);
            } else if (role === "ranged" || role === "遠隔物理dps") {
                if (ranged) ranged.appendChild(div);
            } else if (role === "caster" || role === "遠隔魔法dps") {
                if (caster) caster.appendChild(div);
            }
        });

    } catch (err) {
        console.error("ジョブ一覧の取得に失敗しました:", err);
    }
}