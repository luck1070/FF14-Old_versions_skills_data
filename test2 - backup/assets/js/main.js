const params = new URLSearchParams(window.location.search);
const jobId = params.get("job");

if (!jobId) {
    console.log("job未指定のためスキップ");
} else {
    loadJobData(jobId);
}

async function loadJobData(jobId) {
    try {
        const res = await fetch("data/skills.json");
        const data = await res.json();
        const job = data[jobId];

        if (!job) {
            console.error("jobが存在しない");
            return;
        }

        document.getElementById("job-name").textContent = job.name;

        const skillSections = document.getElementById("skill-sections");
        const comboList = document.getElementById("combo-list");

        skillSections.innerHTML = "";
        comboList.innerHTML = "";

        const classSkills = job.classSkills || [];
        const jobSkills = job.jobSkills || [];
        const allSkills = [...classSkills, ...jobSkills];

        // スキルカード作成関数
        const createSkillContainer = (skills) => {
            const container = document.createElement("div");
            container.className = "grid";

            skills.forEach(skill => {
                const div = document.createElement("div");
                div.className = "skill";

                const levelText = skill.level ? `Lv.${skill.level}` : "";
                const descText = skill.description || "";

                // ルビタグの組み立て
                const nameHtml = skill.ruby 
                    ? `<ruby>${skill.name}<rt>${skill.ruby}</rt></ruby>` 
                    : skill.name;

                div.innerHTML = `
                    <img src="assets/images/${skill.id}.png" 
                         class="icon" 
                         alt="${skill.name}" 
                         title="${skill.name} (${levelText})\n${descText}">
                    <div class="skill-name">${nameHtml}</div>
                `;

                container.appendChild(div);
            });

            return container;
        };

        // ロールスキルの描画
        if (classSkills.length > 0) {
            const heading = document.createElement("h2");
            heading.textContent = `ロールスキル（${job.class || "ロール"}）`;
            skillSections.appendChild(heading);
            skillSections.appendChild(createSkillContainer(classSkills));
        }

        // ジョブスキルの描画
        if (jobSkills.length > 0) {
            const heading = document.createElement("h2");
            heading.textContent = `ジョブスキル（${job.name}）`;
            skillSections.appendChild(heading);
            skillSections.appendChild(createSkillContainer(jobSkills));
        }

        // コンボの描画
        const nonStarterSkillIds = new Set();
        allSkills.forEach(skill => {
            if (skill.combo && Array.isArray(skill.combo)) {
                skill.combo.forEach(nextId => nonStarterSkillIds.add(nextId));
            }
        });

        let hasCombo = false;

        allSkills.forEach(skill => {
            if (skill.combo && !nonStarterSkillIds.has(skill.id)) {
                hasCombo = true;

                const comboDiv = document.createElement("div");
                comboDiv.className = "combo-item";

                let chain = [skill];
                let current = skill;
                const visited = new Set([skill.id]);

                while (current.combo && current.combo.length > 0) {
                    const nextId = current.combo[0];

                    if (visited.has(nextId)) break;

                    const next = allSkills.find(s => s.id === nextId);
                    if (!next) break;

                    chain.push(next);
                    visited.add(nextId);
                    current = next;
                }

                comboDiv.innerHTML = chain.map((s, i) => {
                    const levelText = s.level ? ` (Lv.${s.level})` : "";
                    const descText = s.description ? `\n${s.description}` : "";

                    const icon = `
                        <img src="assets/images/${s.id}.png"
                            class="icon combo-icon"
                            title="${s.name}${levelText}${descText}"
                            alt="${s.name}">
                    `;

                    return i === 0 ? icon : `<span class="arrow">→</span>${icon}`;
                }).join("");

                comboList.appendChild(comboDiv);
            }
        });

        if (!hasCombo) {
            comboList.innerHTML = "<p class='no-data'>コンボ情報はありません。</p>";
        }

    } catch (err) {
        console.error("JSON読み込み失敗", err);
    }
}