const { JSDOM } = require("jsdom");

(async () => {
  const dom = await JSDOM.fromURL("http://127.0.0.1:8642/", {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
  });

  // localStorage polyfill (jsdom supports it natively via resources:'usable' + url)
  await new Promise((resolve, reject) => {
    dom.window.addEventListener("load", resolve);
    setTimeout(() => reject(new Error("timeout waiting for load")), 5000);
  });

  // give scripts a tick to run (they're synchronous <script src> already loaded by then)
  await new Promise((r) => setTimeout(r, 200));

  const doc = dom.window.document;
  const cards = doc.querySelectorAll(".card");
  console.log("Cards rendered:", cards.length);
  if (cards.length !== 50) throw new Error("Expected 50 cards, got " + cards.length);

  const installedCountEl = doc.getElementById("installedCount");
  console.log("Initial installed count:", installedCountEl.textContent);
  if (installedCountEl.textContent !== "0") throw new Error("Expected initial count 0");

  // Click install on first card's install-btn
  const firstBtn = doc.querySelector(".install-btn");
  const firstCardName = doc.querySelector(".card-name").textContent;
  firstBtn.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));

  console.log("After 1 install click, count:", installedCountEl.textContent);
  if (installedCountEl.textContent !== "1") throw new Error("Expected count 1 after click");
  console.log("First card name was:", firstCardName, "-> button now says:", doc.querySelector(".install-btn").textContent.trim());

  // Test search filter
  const searchBox = doc.getElementById("searchBox");
  searchBox.value = "pdf";
  searchBox.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  const filteredCards = doc.querySelectorAll(".card");
  console.log("Cards after searching 'pdf':", filteredCards.length);
  filteredCards.forEach(c => console.log("  ->", c.querySelector(".card-name").textContent));

  // Reset search
  searchBox.value = "";
  searchBox.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));

  // Test category filter chips
  const chips = doc.querySelectorAll(".chip");
  console.log("Category chips:", [...chips].map(c => c.textContent));
  const privacyChip = [...chips].find(c => c.textContent === "Privacy & Security");
  privacyChip.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  console.log("Cards in 'Privacy & Security':", doc.querySelectorAll(".card").length);

  // Reset to All
  const allChip = [...doc.querySelectorAll(".chip")].find(c => c.textContent === "All");
  allChip.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));

  // Install all button
  doc.getElementById("installAllBtn").dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  console.log("After install-all, count:", installedCountEl.textContent);
  if (installedCountEl.textContent !== "50") throw new Error("Expected 50 after install-all");
  console.log("Progress bar width:", doc.getElementById("progressFill").style.width);

  // Check localStorage persisted
  const stored = dom.window.localStorage.getItem("illegal50_installed_v1");
  const storedArr = JSON.parse(stored);
  console.log("localStorage entries count:", storedArr.length);
  if (storedArr.length !== 50) throw new Error("localStorage did not persist 50 entries");

  // Reset all (mock confirm to return true)
  dom.window.confirm = () => true;
  doc.getElementById("resetAllBtn").dispatchEvent(new dom.window.Event("click", { bubbles: true }));
  await new Promise((r) => setTimeout(r, 50));
  console.log("After reset, count:", installedCountEl.textContent);
  if (installedCountEl.textContent !== "0") throw new Error("Expected 0 after reset");

  console.log("\nALL CHECKS PASSED");
})().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
