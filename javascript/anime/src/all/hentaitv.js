const kegaretaSauces = [{
    "name": "HentaiTV",
    "lang": "all",
    "baseUrl": "https://hentai.tv",
    "apiUrl": "",
    "iconUrl": "https://hentai.tv/favicon.ico",
    "typeSource": "single",
    "itemType": 1,
    "isNsfw": true,
    "version": "0.0.1.3",
    "dateFormat": "",
    "dateFormatLocale": "",
    "pkgPath": "anime/src/all/hentaitv.js"
}];

class DefaultExtension extends MProvider {

    async getPopular(page) {

        const res = await new Client().get(
            `${this.source.baseUrl}/page/${page}`
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select(".crsl-slde");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const img = item.selectFirst("img");

            list.push({
                name: a.text.trim(),
                imageUrl: img?.attr("src"),
                link: a.attr("href")
            });
        }

        return {
            list,
            hasNextPage: true
        };
    }

    async getLatestUpdates(page) {
        return await this.getPopular(page);
    }

    async search(query, page, filters) {

        const res = await new Client().get(
            `${this.source.baseUrl}/?s=${encodeURIComponent(query)}`
        );

        const doc = new Document(res.body);

        const list = [];

        const items = doc.select(".crsl-slde, article");

        for (const item of items) {

            const a = item.selectFirst("a");

            if (!a) continue;

            const img = item.selectFirst("img");

            list.push({
                name: a.text.trim(),
                imageUrl: img?.attr("src"),
                link: a.attr("href")
            });
        }

        return {
            list,
            hasNextPage: false
        };
    }

    async getDetail(url) {

        const res = await new Client().get(url);

        const doc = new Document(res.body);

        const episodes = [{
            name: "Episode 1",
            url: url
        }];

        const title =
            doc.selectFirst("h1")?.text ??
            doc.selectFirst("title")?.text ??
            "Unknown";

        const image =
            doc.selectFirst("meta[property='og:image']")
                ?.attr("content") ??
            doc.selectFirst("img")?.attr("src");

        const description =
            doc.selectFirst("meta[name='description']")
                ?.attr("content") ?? "";

        return {
            name: title,
            imageUrl: image,
            description: description,
            episodes
        };
    }

async getVideoList(url) {

    const client = new Client();

    // STEP 1: Load episode page
    const res = await client.get(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        }
    });

    const body = res.body;

    // STEP 2: Find iframe/player URL
    const iframeMatch =
        body.match(/<iframe[^>]+src=["']([^"']+)["']/i);

    if (!iframeMatch) {

        console.log("IFRAME NOT FOUND");

        return [];
    }

    let iframeUrl = iframeMatch[1];

    // Fix relative URLs
    if (iframeUrl.startsWith("//")) {
        iframeUrl = "https:" + iframeUrl;
    }

    if (iframeUrl.startsWith("/")) {
        iframeUrl = this.source.baseUrl + iframeUrl;
    }

    console.log("IFRAME URL:", iframeUrl);

    // STEP 3: Load iframe/player page
    const iframeRes = await client.get(iframeUrl, {
        headers: {
            "Referer": url,
            "Origin": this.source.baseUrl,
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "*/*"
        }
    });

    const html = iframeRes.body;

    console.log("PLAYER HTML:");
    console.log(html);

    // STEP 4: Extract cookies
    let cookies = "";

    try {

        const setCookie =
            iframeRes.headers["set-cookie"];

        if (setCookie) {

            if (Array.isArray(setCookie)) {

                cookies = setCookie
                    .map(v => v.split(";")[0])
                    .join("; ");

            } else {

                cookies =
                    setCookie
                        .split(";")[0];
            }
        }

    } catch (e) {

        console.log("COOKIE ERROR:", e);
    }

    console.log("COOKIES:", cookies);

    // STEP 5: Find MP4/M3U8 URLs
    const matches = [];

    // direct URLs
    const directRegex =
        /https?:\/\/[^"' ]+\.(mp4|m3u8)[^"' ]*/gi;

    matches.push(
        ...[...html.matchAll(directRegex)]
            .map(v => v[0])
    );

    // JWPlayer file:
    const fileRegex =
        /file\s*:\s*["']([^"']+)["']/gi;

    matches.push(
        ...[...html.matchAll(fileRegex)]
            .map(v => v[1])
    );

    console.log("MATCHES:", matches);

    // STEP 6: Build video list
    const videos = [];

    const used = new Set();

    for (const videoUrl of matches) {

        if (
            !videoUrl.includes(".mp4") &&
            !videoUrl.includes(".m3u8")
        ) {
            continue;
        }

        if (used.has(videoUrl)) {
            continue;
        }

        used.add(videoUrl);

        videos.push({

            url: videoUrl,

            originalUrl: videoUrl,

            quality:
                videoUrl.includes(".m3u8")
                    ? "HLS"
                    : "MP4",

            headers: {

                "Referer": iframeUrl,

                "Origin": this.source.baseUrl,

                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",

                "Accept": "*/*",

                "Accept-Language":
                    "en-US,en;q=0.9",

                "Sec-Fetch-Dest":
                    "video",

                "Sec-Fetch-Mode":
                    "cors",

                "Sec-Fetch-Site":
                    "cross-site",

                "Cookie": cookies
            }
        });
    }

    console.log("VIDEOS:", videos);

    return videos;
}

    async getPageList() {
        throw new Error("Not manga source");
    }

    getFilterList() {
        return [];
    }

    getSourcePreferences() {
        return [];
    }
}

extension = new DefaultExtension();
