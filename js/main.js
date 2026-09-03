document.addEventListener("DOMContentLoaded", () => {
	const params = new URLSearchParams(window.location.search);
	const jobId = params.get("job");

	if (!jobId) {
		console.log("job未指定");
	} else {
		loadJobData(jobId);
	}
});

async function loadJobData(jobId) {
	try {
		const res = await fetch("data/skills.json");
		if (!res.ok) {
			throw new Error(`HTTP error! status: ${res.status}`);
		}

		const data = await res.json();
		const job = data[jobId];

		if (!job) {
			console.error("対象のjobが存在しません:", jobId);
			return;
		}

		// ジョブ名とロールタイトルの更新
		const roleText = job.role || job.class || "ロール";
		document.getElementById("job-name").textContent = job.name;

		const roleTitleEl = document.getElementById("role-title");
		if (roleTitleEl) {
			roleTitleEl.textContent = `ロールスキル（${roleText}）`;
		}

		const classSkills = job.classSkills || [];
		const jobSkills = job.jobSkills || [];

		// スキルカード描画
		renderSkills(classSkills, "class-skill-list");
		renderSkills(jobSkills, "job-skill-list");

		// コンボ表示描画
		renderCombos([...classSkills, ...jobSkills]);

	} catch (err) {
		console.error("データの取得に失敗しました:", err);
	}
}

// HTMLエスケープ（修正済み）
function escapeHtml(str) {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// スキルカード描画
// スキルカード描画
function renderSkills(skills, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = "";

    skills.forEach(skill => {
        const div = document.createElement("div");
        div.className = "skill";

        // ルビ対応
        const rubyText = skill.kana || skill.ruby;
        const nameHtml = rubyText
            ? `<ruby>${escapeHtml(skill.name)}<rt>${escapeHtml(rubyText)}</rt></ruby>`
            : escapeHtml(skill.name);

        // 習得レベル
        const levelText = skill.level ? `習得Lv.${skill.level}` : "";

        // 種別（GCD / アビ）
        let typeLabel = "";
        if (skill.type === "gcd") {
            typeLabel = `<span class="type gcd">WS</span>`;
        } else if (skill.type === "ogcd") {
            typeLabel = `<span class="type ogcd">アビ</span>`;
        }

        // リキャスト
        const recastText = skill.recast ? `<span class="recast">CT:${skill.recast}</span>` : "";

        // 射程
        const rangeText = skill.range ? `<div class="skill-extra">射程：${escapeHtml(skill.range)}</div>` : "";

        // MP
        const mpText = skill.mp_cost !== undefined
            ? `<div class="skill-extra">MP：${skill.mp_cost}</div>`
            : "";

        // 改行文字（\n）をHTMLの<br>タグに変換
        const escapedDesc = escapeHtml(skill.description || "").replace(/\n/g, "<br>");

        div.innerHTML = `
            <img src="assets/images/${skill.id}.png" 
                class="icon" 
                alt="${escapeHtml(skill.name)}"
                onerror="this.style.display='none'">

            <div class="skill-name">${nameHtml}</div>

            <div class="skill-level">${levelText}</div>

            <div class="skill-meta">
                ${typeLabel}
                ${recastText}
            </div>

            ${rangeText}
            ${mpText}

            <div class="skill-desc">${escapedDesc}</div>
        `;

        container.appendChild(div);
    });
}

// コンボ描画
function renderCombos(allSkills) {
	const comboList = document.getElementById("combo-list");
	if (!comboList) return;

	comboList.innerHTML = "";

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
				const icon = `
					<img src="assets/images/${s.id}.png"
						class="icon combo-icon"
						alt="${escapeHtml(s.name)}"
						title="${escapeHtml(s.name)}"
						onerror="this.style.display='none'">
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