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

// スキルカード描画関数
function renderSkills(skills, containerId) {
	const container = document.getElementById(containerId);
	if (!container) return;

	container.innerHTML = "";

	skills.forEach(skill => {
		const div = document.createElement("div");
		div.className = "skill";

		// kana / ruby 両方のキー名に対応
		const rubyText = skill.kana || skill.ruby;
		const nameHtml = rubyText
			? `<ruby>${skill.name}<rt>${rubyText}</rt></ruby>`
			: skill.name;

		const levelText = skill.level ? `Lv.${skill.level}` : "";
		const descText = skill.description ? `\n${skill.description}` : "";

		div.innerHTML = `
			<img src="assets/images/${skill.id}.png" 
					 class="icon" 
					 alt="${skill.name}" 
					 title="${skill.name} (${levelText})${descText}">
			<div class="skill-name">${nameHtml}</div>
			<div class="skill-level">${levelText}</div>
		`;

		container.appendChild(div);
	});
}

// コンボチェーン描画関数
function renderCombos(allSkills) {
	const comboList = document.getElementById("combo-list");
	if (!comboList) return;

	comboList.innerHTML = "";

	// 派生先として指定されているスキルIDを抽出（コンボの途中に位置するスキルを特定）
	const nonStarterSkillIds = new Set();
	allSkills.forEach(skill => {
		if (skill.combo && Array.isArray(skill.combo)) {
			skill.combo.forEach(nextId => nonStarterSkillIds.add(nextId));
		}
	});

	let hasCombo = false;

	allSkills.forEach(skill => {
		// コンボの起点となるスキルからルートをたどる
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
}