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
		const dps = document.getElementById("dps-list");

		// リストの初期化（クリア）
		if (tank) tank.innerHTML = "";
		if (healer) healer.innerHTML = "";
		if (dps) dps.innerHTML = "";

		Object.keys(data).forEach(key => {
			const job = data[key];

			const link = document.createElement("a");
			link.href = `job-detail.html?job=${key}`;
			link.className = "job-card";
			link.textContent = job.name;

			const div = document.createElement("div");
			div.appendChild(link);

			// JSON側が role または class のどちらで定義されていても対応
			const role = job.role || job.class;

			if (role === "タンク" && tank) {
				tank.appendChild(div);
			} else if (role === "ヒーラー" && healer) {
				healer.appendChild(div);
			} else if (dps) {
				dps.appendChild(div);
			}
		});

	} catch (err) {
		console.error("ジョブ一覧の取得に失敗しました:", err);
	}
}