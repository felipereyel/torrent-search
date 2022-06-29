import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { parse } from "node-html-parser";

const app = express();
const port = process.env.PORT || 3000;

const BASE_TORRENT_URL = "https://torlock2.com";

app.use(cors());
app.use(express.json());

function findHref(html, filter) {
	const doc = parse(html);
	const [url] = doc
		.getElementsByTagName("a")
		.map(el => el.getAttribute("href"))
		.filter(href => href && filter(href));
	return url;
}

app.get("/", async (req, res) => {
	if (!req.query.q) return res.status(400).send("Missing query parameter");

	const html1 = await fetch(
		`${BASE_TORRENT_URL}/?q=${req.query.q.replace(/ /g, "+")}`
	).then(res => res.text());

	const torUrl = findHref(html1, href => href.startsWith("/torrent/"));
	if (!torUrl) return res.status(404).send("Not found");

	const source = `${BASE_TORRENT_URL}${torUrl}`;
	const html2 = await fetch(source).then(res => res.text());
	const [hash] = html2.match(/[a-z0-9]{40}/g);
	const url = findHref(html2, href => href.endsWith(".torrent"));

	res.json({ url, hash, source });
});

const server = app.listen(port, () => console.log(`Listening on port ${port}`));
