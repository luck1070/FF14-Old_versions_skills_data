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

    // 💡 追加：専用システムの要素
    const specialSection = document.getElementById("special-system-section");
    const specialTitleEl = document.getElementById("special-system-title");
    const specialContentEl = document.getElementById("special-system-content");

    if (roleTitleEl) roleTitleEl.textContent = `ロールスキル（${job.role}）`;

    // 既存のスキル割り当て（JSONの構造に合わせて逆転させている状態を維持）
    const classSkills = job.jobSkills || []; 
    const jobSkills = job.classSkills || []; 

    const hasAnySkills = classSkills.length > 0 || jobSkills.length > 0;

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

    // 💡 追加：ジョブ専用システムの表示・非表示切り替えと描画
    if (job.specialSystem && specialSection) {
        specialSection.style.display = "block";
        if (specialTitleEl) specialTitleEl.textContent = job.specialSystem.title;
        
        if (specialContentEl) {
            const descHtml = escapeHtml(job.specialSystem.description || "").replace(/\n/g, "<br>");
            specialContentEl.innerHTML = `<p class="special-desc">${descHtml}</p>`;
            
            // 専用システム内にスキル一覧がある場合（必要に応じて）
            if (job.specialSystem.skills && job.specialSystem.skills.length > 0) {
                const subGrid = document.createElement("div");
                subGrid.className = "grid";
                // 必要であれば通常のスキルカード生成関数を流用可能
                job.specialSystem.skills.forEach(skill => {
                    // 個別のカード要素生成処理をここに書くか、共通化する
                });
                specialContentEl.appendChild(subGrid);
            }
        }
    } else if (specialSection) {
        specialSection.style.display = "none";
    }

    renderSkills(classSkills, "class-skill-list", jobId);
    renderSkills(jobSkills, "job-skill-list", jobId);
    renderCombos([...classSkills, ...jobSkills], jobId);
}

// ✅ スキルカード（ソート条件を反映して描画）
// ✅ renderSkills関数内での画像パス切り替え
function renderSkills(skills, containerId, jobId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";

    // ソート処理などはそのまま...
    const levelSortOrder = document.getElementById("level-sort")?.value || "asc";
    const typeOrderOption = document.getElementById("type-order")?.value || "pure-level";

    const sortedSkills = [...skills].sort((a, b) => {
        const levelA = a.level || 0;
        const levelB = b.level || 0;
        if (typeOrderOption === "pure-level") {
            return levelSortOrder === "desc" ? levelB - levelA : levelA - levelB;
        }
        const orderA = a.type === "ogcd" ? 2 : 1;
        const orderB = b.type === "ogcd" ? 2 : 1;
        if (typeOrderOption === "ogcd-top") {
            const revA = a.type === "ogcd" ? 1 : 2;
            const revB = b.type === "ogcd" ? 1 : 2;
            if (revA !== revB) return revA - revB;
        } else {
            if (orderA !== orderB) return orderA - orderB;
        }
        return levelSortOrder === "desc" ? levelB - levelA : levelA - levelB;
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
        const mpText = skill.mp_cost !== undefined ? `<div class="skill-extra">MP：${skill.mp_cost}</div>` : "";
        const desc = escapeHtml(skill.description || "").replace(/\n/g, "<br>");

        // 💡 変更ここから：range（距離）と aoe_radius（効果範囲）を個別に処理
        // 距離：矢印アイコンや記号を使う（例: ➔ 25m、または ↗ 25m）
        let rangeDisplay = "";
        if (skill.range !== undefined) {
            const rangeVal = skill.range === 0 ? "自身" : `${skill.range}m`;
            const rangeClass = (skill.range === 0 || skill.range <= 3) ? "melee-range" : "long-range";
            // 矢印（➔ や ↗）を添える
            rangeDisplay = `<div class="skill-extra ${rangeClass}">🡨🡪 射程：${rangeVal}</div>`;
        }

        // 範囲：円マークやアイコンを使う（例: ◎ 半径5m、または 円 5m）
        // 💡 範囲（aoe_radius）の処理を修正
        let aoeDisplay = "";
        if (skill.aoe_radius !== undefined) {
            if (skill.aoe_radius === 0) {
                // 範囲が 0（単体スキルなど）の場合に出力する内容
                aoeDisplay = `<div class="skill-extra aoe-single">◦ 範囲：単体</div>`;
            } else {
                // 0より大きい（範囲攻撃）場合
                aoeDisplay = `<div class="skill-extra aoe-badge">◯ 範囲：${skill.aoe_radius}m</div>`;
            }
        }
        // 💡 変更ここまで

        // 画像パスのフォルダ分岐
        let imagePath = "";
        if (containerId === "class-skill-list") {
            const roleFolder = currentJobData.role || "common";
            imagePath = `assets/images/common/${roleFolder}/${skill.id}.png`;
        } else {
            imagePath = `assets/images/${jobId}/${skill.id}.png`;
        }

        div.innerHTML = `
            <img src="${imagePath}" class="icon" alt="${escapeHtml(skill.name)}" title="${escapeHtml(skill.name)}" onerror="this.onerror=null; this.src='assets/images/common/${skill.id}.png'">
            <div class="skill-name">${nameHtml}</div>
            <div class="skill-level">${levelText}</div>
            <div class="skill-meta">${typeLabel}${recastText}</div>
            ${rangeDisplay}
            ${aoeDisplay}
            ${mpText}
            <div class="skill-desc">${desc}</div>
        `;
        return div;
    };

    // グリッド描画部分はそのまま...
    if (typeOrderOption === "pure-level") {
        const singleGrid = document.createElement("div");
        singleGrid.className = "grid";
        sortedSkills.forEach(skill => singleGrid.appendChild(createSkillCard(skill)));
        container.appendChild(singleGrid);
    } else {
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