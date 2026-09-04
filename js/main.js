let currentJobData = null;
let currentJobId = null;

document.addEventListener("DOMContentLoaded", () => {
    const params = new URLSearchParams(window.location.search);
    const jobId = params.get("job");

    if (!jobId) {
        console.log("job未指定");
    } else {
        loadJobData(jobId);
    }

    // コントロール変更時のイベントリスナー設定
    document.getElementById("level-sort")?.addEventListener("change", triggerReRender);
    document.getElementById("type-order")?.addEventListener("change", triggerReRender);
});

async function loadJobData(jobId) {
    try {
        const res = await fetch("data/skills.json");
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        const job = data[jobId];

        if (!job) {
            console.error("対象のjobが存在しません:", jobId);
            return;
        }

        currentJobData = job;
        currentJobId = jobId;

        document.getElementById("job-name").textContent = job.name;
        renderJobContent();

    } catch (err) {
        console.error("データの取得に失敗しました:", err);
    }
}

// コントロール変更時に再描画を行う関数
function triggerReRender() {
    if (currentJobData && currentJobId) {
        renderJobContent();
    }
}

// 描画の振り分けとコントロール値の取得
function renderJobContent() {
    const job = currentJobData;
    const jobId = currentJobId;

    const roleTitleEl = document.getElementById("role-title");
    const classSkillListEl = document.getElementById("class-skill-list");
    const jobTitleEl = document.getElementById("job-title");
    const jobSkillListEl = document.getElementById("job-skill-list");
    const magicTitleEl = document.getElementById("magic-title");
    const magicSkillListEl = document.getElementById("magic-skill-list");
    const comboTitleEl = document.getElementById("combo-title");
    const comboListEl = document.getElementById("combo-list");

    if (roleTitleEl) roleTitleEl.textContent = `ロールスキル（${job.role}）`;

    const classSkills = job.classSkills || [];
    const jobSkills = job.jobSkills || [];
    const magicSkills = job.magicSkills || [];

    const hasAnySkills = classSkills.length > 0 || jobSkills.length > 0 || magicSkills.length > 0;

    if (!hasAnySkills) {
        [roleTitleEl, classSkillListEl, jobTitleEl, jobSkillListEl, magicTitleEl, magicSkillListEl, comboTitleEl, comboListEl].forEach(el => {
            if (el) el.style.display = "none";
        });
        return;
    }

    if (comboTitleEl) comboTitleEl.style.display = "block";
    if (comboListEl) comboListEl.style.display = "block";

    if (job.isMagic) {
        if (roleTitleEl) roleTitleEl.style.display = "none";
        if (classSkillListEl) classSkillListEl.style.display = "none";
        if (jobTitleEl) roleTitleEl.style.display = "none";
        if (jobSkillListEl) jobSkillListEl.style.display = "none";
        
        if (magicTitleEl) magicTitleEl.style.display = "block";
        if (magicSkillListEl) magicSkillListEl.style.display = "flex";

        renderSkills(magicSkills, "magic-skill-list", jobId);
        renderCombos(magicSkills, jobId);
    } else {
        if (roleTitleEl) roleTitleEl.style.display = "block";
        if (classSkillListEl) classSkillListEl.style.display = "flex";
        if (jobTitleEl) roleTitleEl.style.display = "block";
        if (jobSkillListEl) jobSkillListEl.style.display = "flex";

        if (magicTitleEl) magicTitleEl.style.display = "none";
        if (magicSkillListEl) magicSkillListEl.style.display = "none";

        renderSkills(classSkills, "class-skill-list", jobId);
        renderSkills(jobSkills, "job-skill-list", jobId);
        renderCombos([...classSkills, ...jobSkills], jobId);
    }
}

// ✅ スキルカード（ソート条件を反映して描画）
function renderSkills(skills, containerId, jobId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";

    // セレクトボックスから設定値を取得
    const levelSortOrder = document.getElementById("level-sort")?.value || "asc";
    const typeOrderOption = document.getElementById("type-order")?.value || "gcd-top";

    // 1. ソート処理（タイプ順 ＆ レベル順）
    const sortedSkills = [...skills].sort((a, b) => {
        const orderA = a.type === "ogcd" ? 2 : 1;
        const orderB = b.type === "ogcd" ? 2 : 1;

        if (typeOrderOption === "ogcd-top") {
            // oGCDを上にする場合 (ogcd=1, gcd=2)
            const revA = a.type === "ogcd" ? 1 : 2;
            const revB = b.type === "ogcd" ? 1 : 2;
            if (revA !== revB) return revA - revB;
        } else {
            // GCDを上にする場合 (gcd=1, ogcd=2)
            if (orderA !== orderB) return orderA - orderB;
        }

        // タイプが同じ場合のレベルソート
        const levelA = a.level || 0;
        const levelB = b.level || 0;
        return levelSortOrder === "desc" ? levelB - levelA : levelA - levelB;
    });

    // 2. 上に配置するグループと下に配置するグループに分割
    const isOgcdFirst = typeOrderOption === "ogcd-top";
    const primaryType = isOgcdFirst ? "ogcd" : "gcd";
    const secondaryType = isOgcdFirst ? "gcd" : "ogcd";

    const primarySkills = sortedSkills.filter(s => {
        if (primaryType === "gcd") return s.type === "gcd" || (!s.type && s.type !== "ogcd");
        return s.type === "ogcd";
    });
    const secondarySkills = sortedSkills.filter(s => {
        if (secondaryType === "gcd") return s.type === "gcd" || (!s.type && s.type !== "ogcd");
        return s.type === "ogcd";
    });

    const createSkillCard = (skill) => {
        const div = document.createElement("div");
        div.className = "skill";

        const rubyText = skill.kana || skill.ruby;
        const nameHtml = rubyText
            ? `<ruby>${escapeHtml(skill.name)}<rt>${escapeHtml(rubyText)}</rt></ruby>`
            : escapeHtml(skill.name);

        const levelText = skill.level ? `習得Lv.${skill.level}` : "";

        let typeLabel = "";
        if (skill.type === "gcd") {
            typeLabel = `<span class="type gcd">WS</span>`;
        } else if (skill.type === "ogcd") {
            typeLabel = `<span class="type ogcd">アビ</span>`;
        }

        const recastText = skill.recast ? `<span class="recast">CT:${skill.recast}</span>` : "";
        const rangeText = skill.range ? `<div class="skill-extra">射程：${escapeHtml(skill.range)}</div>` : "";
        const mpText = skill.mp_cost !== undefined ? `<div class="skill-extra">MP：${skill.mp_cost}</div>` : "";
        const desc = escapeHtml(skill.description || "").replace(/\n/g, "<br>");

        div.innerHTML = `
            <img src="assets/images/${jobId}/${skill.id}.png" class="icon" alt="${escapeHtml(skill.name)}" title="${escapeHtml(skill.name)}" onerror="this.onerror=null; this.src='assets/images/common/${skill.id}.png'">
            <div class="skill-name">${nameHtml}</div>
            <div class="skill-level">${levelText}</div>
            <div class="skill-meta">${typeLabel}${recastText}</div>
            ${rangeText}
            ${mpText}
            <div class="skill-desc">${desc}</div>
        `;
        return div;
    };

    if (primarySkills.length > 0) {
        const primaryGrid = document.createElement("div");
        primaryGrid.className = "grid";
        primarySkills.forEach(skill => primaryGrid.appendChild(createSkillCard(skill)));
        container.appendChild(primaryGrid);
    }

    if (secondarySkills.length > 0) {
        const secondaryGrid = document.createElement("div");
        secondaryGrid.className = "grid";
        secondarySkills.forEach(skill => secondaryGrid.appendChild(createSkillCard(skill)));
        container.appendChild(secondaryGrid);
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

function renderCombos(allSkills, jobId) {
    // コンボ描画処理（既存のまま）
    const comboList = document.getElementById("combo-list");
    if (!comboList) return;
    comboList.innerHTML = "";
    // ...（省略：既存のコンボ描画ロジックをそのまま配置）
    
    const nonStarterSkillIds = new Set();
    allSkills.forEach(skill => {
        if (skill.combo) {
            skill.combo.forEach(id => nonStarterSkillIds.add(id));
        }
    });

    let hasCombo = false;

    allSkills.forEach(skill => {
        if (skill.combo && !nonStarterSkillIds.has(skill.id)) {
            hasCombo = true;

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

            const comboDiv = document.createElement("div");
            comboDiv.className = "combo-item";

            comboDiv.innerHTML = chain.map((s, i) => {
                const icon = `
                    <img src="assets/images/${jobId}/${s.id}.png"
                        class="icon combo-icon"
                        alt="${escapeHtml(s.name)}"
                        title="${escapeHtml(s.name)}"
                        onerror="this.onerror=null; this.src='assets/images/common/${s.id}.png'; if(!this.complete){this.style.display='none'}">
                `;

                return i === 0 ? icon : `<span class="arrow">→</span>${icon}`;
            }).join("");

            comboList.appendChild(comboDiv);
        }
    });

    if (!hasCombo) {
        comboList.innerHTML = "<p class='no-data'>コンボ情報はありません。</p>";
    }
}