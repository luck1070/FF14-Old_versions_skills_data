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
        const params = new URLSearchParams(window.location.search);
        const version = params.get("v") || "7.5";
        const jsonPath = `data/skills-v${version}.json`;

        const res = await fetch(jsonPath);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        const jobsData = data.jobs || data;
        const job = jobsData[jobId];

        if (!job) {
            console.error("対象のjobが存在しません:", jobId);
            return;
        }

        currentJobData = job;
        currentJobId = jobId;

        const jobNameEl = document.getElementById("job-name");
        if (jobNameEl) jobNameEl.textContent = job.name;

        // 「戻る」ボタンのリンク先を現在のバージョン保持のまま jobs.html へ設定
        const backLinkEl = document.querySelector(".back-link");
        if (backLinkEl) backLinkEl.href = `jobs.html?v=${version}`;

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

/* =========================
   ★ 共通カード生成（堅牢性を向上）
========================= */
function createSkillCard(skill, jobId, pathType = "job") {
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
    const mpText = skill.mp_cost !== undefined ? `<div class="skill-extra">MP：${skill.mp_cost}</div>` : "";
    const desc = escapeHtml(skill.description || "").replace(/\n/g, "<br>");

    let rangeDisplay = "";
    if (skill.range !== undefined) {
        const rangeVal = skill.range === 0 ? "自身" : `${skill.range}m`;
        const rangeClass = (skill.range === 0 || skill.range <= 3) ? "melee-range" : "long-range";
        rangeDisplay = `<div class="skill-extra ${rangeClass}">🡨🡪 射程：${rangeVal}</div>`;
    }

    let aoeDisplay = "";
    if (skill.aoe_radius !== undefined) {
        if (skill.aoe_radius === 0) {
            aoeDisplay = `<div class="skill-extra aoe-single">◦ 範囲：単体</div>`;
        } else {
            aoeDisplay = `<div class="skill-extra aoe-badge">◯ 範囲：${skill.aoe_radius}m</div>`;
        }
    }

    // 1. スキルデータ自体に画像パスが指定されていればそれを最優先
    let imagePath = skill.image;

    if (!imagePath) {
        // 2. pathType に応じて安全に切り替え
        if (pathType === "role") {
            const roleFolder = currentJobData?.role || "common";
            imagePath = `assets/images/common/${roleFolder}/${skill.id}.png`;
        } else if (pathType === "special") {
            // 特殊システム用（必要に応じてジョブ固有または専用フォルダへ）
            imagePath = `assets/images/${jobId}/${skill.id}.png`;
        } else {
            // デフォルト（job）
            imagePath = `assets/images/${jobId}/${skill.id}.png`;
        }
    }

    div.innerHTML = `
        <img src="${imagePath}" class="icon" alt="${escapeHtml(skill.name)}" title="${escapeHtml(skill.name)}"
            onerror="handleImageError(this, '${skill.id}')">
        <div class="skill-name">${nameHtml}</div>
        <div class="skill-level">${levelText}</div>
        <div class="skill-meta">${typeLabel}${recastText}</div>
        ${rangeDisplay}
        ${aoeDisplay}
        ${mpText}
        <div class="skill-desc">${desc}</div>
    `;

    return div;
}

/* 画像読み込み失敗時のフォールバック処理を安全に行う関数 */
function handleImageError(imgEl, skillId) {
    if (imgEl.dataset.fallbackTried) {
        // すでに共通フォルダも失敗している場合はプレースホルダーに差し替え
        imgEl.src = "assets/images/common/placeholder.png";
        return;
    }
    imgEl.dataset.fallbackTried = "true";
    imgEl.src = `assets/images/common/${skillId}.png`;
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

    const specialSection = document.getElementById("special-system-section");
    const specialTitleEl = document.getElementById("special-system-title");
    const specialContentEl = document.getElementById("special-system-content");

    if (roleTitleEl) roleTitleEl.textContent = `ロールスキル（${job.role || ""}）`;

    const roleSkills = job.roleSkills || []; 
    const jobSkills = job.jobSkills || []; 

    const hasAnySkills = roleSkills.length > 0 || jobSkills.length > 0;

    if (!hasAnySkills) {
        [roleTitleEl, classSkillListEl, jobTitleEl, jobSkillListEl, magicTitleEl, magicSkillListEl, comboTitleEl, comboListEl, specialSection].forEach(el => {
            if (el) el.style.display = "none";
        });
        return;
    }

    // 魔法要素は非表示
    if (magicTitleEl) magicTitleEl.style.display = "none";
    if (magicSkillListEl) magicSkillListEl.style.display = "none";

    // 共通の表示処理
    if (roleTitleEl) roleTitleEl.style.display = "block";
    if (classSkillListEl) classSkillListEl.style.display = "flex";
    if (jobTitleEl) jobTitleEl.style.display = "block";
    if (jobSkillListEl) jobSkillListEl.style.display = "flex";
    if (comboTitleEl) comboTitleEl.style.display = "block";
    if (comboListEl) comboListEl.style.display = "block";

    // ジョブ専用システムの表示・非表示切り替えと描画
    if (job.specialSystem && specialSection) {
        specialSection.style.display = "block";
        if (specialTitleEl) specialTitleEl.textContent = job.specialSystem.title;
        
        if (specialContentEl) {
            const descHtml = escapeHtml(job.specialSystem.description || "").replace(/\n/g, "<br>");
            specialContentEl.innerHTML = `<p class="special-desc">${descHtml}</p>`;
            
            if (job.specialSystem.skills && job.specialSystem.skills.length > 0) {
                const subGrid = document.createElement("div");
                subGrid.className = "grid";
                
                // 特殊システムのスキルカードを安全に生成して追加
                job.specialSystem.skills.forEach(skill => {
                    subGrid.appendChild(createSkillCard(skill, jobId, "special"));
                });
                
                specialContentEl.appendChild(subGrid);
            }
        }
    } else if (specialSection) {
        specialSection.style.display = "none";
    }

    renderSkills(roleSkills, "class-skill-list", jobId, "role");
    renderSkills(jobSkills, "job-skill-list", jobId, "job");
    renderCombos([...roleSkills, ...jobSkills], jobId);
}

// ✅ スキルカード（ソート条件を反映して描画）
function renderSkills(skills, containerId, jobId, pathType) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";

    const levelSortOrder = document.getElementById("level-sort")?.value || "asc";
    const typeOrderOption = document.getElementById("type-order")?.value || "pure-level";

    const sortedSkills = [...skills].sort((a, b) => {
        const levelA = a.level || 0;
        const levelB = b.level || 0;
        const levelDiff = levelSortOrder === "desc" ? levelB - levelA : levelA - levelB;

        if (typeOrderOption === "pure-level") {
            return levelDiff;
        }

        const isOgcdFirst = typeOrderOption === "ogcd-top";
        const orderA = a.type === "ogcd" ? (isOgcdFirst ? 1 : 2) : (isOgcdFirst ? 2 : 1);
        const orderB = b.type === "ogcd" ? (isOgcdFirst ? 1 : 2) : (isOgcdFirst ? 2 : 1);

        if (orderA !== orderB) {
            return orderA - orderB;
        }

        return levelDiff;
    });

    if (typeOrderOption === "pure-level") {
        const singleGrid = document.createElement("div");
        singleGrid.className = "grid";
        sortedSkills.forEach(skill => singleGrid.appendChild(createSkillCard(skill, jobId, pathType)));
        container.appendChild(singleGrid);
    } else {
        const isOgcdFirst = typeOrderOption === "ogcd-top";
        const primarySkills = sortedSkills.filter(s => isOgcdFirst ? s.type === "ogcd" : s.type !== "ogcd");
        const secondarySkills = sortedSkills.filter(s => isOgcdFirst ? s.type !== "ogcd" : s.type === "ogcd");

        if (primarySkills.length > 0) {
            const primaryGrid = document.createElement("div");
            primaryGrid.className = "grid";
            primarySkills.forEach(skill => primaryGrid.appendChild(createSkillCard(skill, jobId, pathType)));
            container.appendChild(primaryGrid);
        }

        if (secondarySkills.length > 0) {
            const secondaryGrid = document.createElement("div");
            secondaryGrid.className = "grid";
            secondarySkills.forEach(skill => secondaryGrid.appendChild(createSkillCard(skill, jobId, pathType)));
            container.appendChild(secondaryGrid);
        }
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
    const comboList = document.getElementById("combo-list");
    if (!comboList) return;
    comboList.innerHTML = "";

    const nonStarterSkillIds = new Set();
    allSkills.forEach(skill => {
        if (skill.combo) {
            skill.combo.forEach(id => nonStarterSkillIds.add(id));
        }
    });

    let hasCombo = false;

    allSkills.forEach(skill => {
        if (skill.combo && skill.combo.length > 0 && !nonStarterSkillIds.has(skill.id)) {
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
                const isRoleSkill = currentJobData?.roleSkills?.some(rs => rs.id === s.id);
                const roleFolder = currentJobData?.role || "common";
                const imgPath = isRoleSkill 
                    ? `assets/images/common/${roleFolder}/${s.id}.png` 
                    : `assets/images/${jobId}/${s.id}.png`;

                const icon = `
                    <img src="${imgPath}"
                        class="icon combo-icon"
                        alt="${escapeHtml(s.name)}"
                        title="${escapeHtml(s.name)}"
                        onerror="this.onerror=null; this.src='assets/images/common/${s.id}.png';">
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

/* ==========================================
   木人討滅戦（10秒連打チャレンジ）のロジック
========================================== */
let isMokujinPlaying = false;
let mokujinScore = 0;
let mokujinTimeLeft = 10;
let mokujinTimer = null;

function startMokujinGame() {
    const punchBtn = document.getElementById("punch-btn");
    const resetBtn = document.getElementById("reset-btn");
    const resultBox = document.getElementById("game-result-msg");
    const scoreSpan = document.getElementById("score");
    const timeLeftSpan = document.getElementById("time-left");

    if (isMokujinPlaying) {
        clearInterval(mokujinTimer);
        isMokujinPlaying = false;
        
        if (punchBtn) punchBtn.disabled = true;
        if (resetBtn) resetBtn.textContent = "スタート";
        if (scoreSpan) scoreSpan.textContent = "0";
        if (timeLeftSpan) timeLeftSpan.textContent = "10";
        if (resultBox) resultBox.textContent = "リセットしました。「スタート」を押してね！";
        return;
    }

    isMokujinPlaying = true;
    mokujinScore = 0;
    mokujinTimeLeft = 10;

    if (punchBtn) punchBtn.disabled = false;
    if (resetBtn) resetBtn.textContent = "リセット";
    
    if (scoreSpan) scoreSpan.textContent = mokujinScore;
    if (timeLeftSpan) timeLeftSpan.textContent = mokujinTimeLeft;
    if (resultBox) resultBox.textContent = "バトル中……！ひたすら連打！";

    if (mokujinTimer) clearInterval(mokujinTimer);
    mokujinTimer = setInterval(() => {
        mokujinTimeLeft--;
        if (timeLeftSpan) timeLeftSpan.textContent = mokujinTimeLeft;

        if (mokujinTimeLeft <= 0) {
            clearInterval(mokujinTimer);
            isMokujinPlaying = false;
            
            if (punchBtn) punchBtn.disabled = true;
            if (resetBtn) resetBtn.textContent = "もう一度遊ぶ";
            
            const dps = (mokujinScore / 10).toFixed(1);
            if (resultBox) {
                resultBox.textContent = `討滅完了！ スコア: ${mokujinScore} (DPS: ${dps})`;
            }
        }
    }, 1000);
}

function punchMokujin() {
    if (!isMokujinPlaying) return;

    mokujinScore++;
    const scoreSpan = document.getElementById("score");
    if (scoreSpan) scoreSpan.textContent = mokujinScore;
}
