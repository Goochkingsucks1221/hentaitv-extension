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

    // STEP 2: Find iframe URL
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

    // STEP 4: Find encoded player URL
    const playerMatch =
        html.match(/data-id=["']([^"']+)["']/i);

    if (!playerMatch) {

        console.log("PLAYER DATA-ID NOT FOUND");

        return [];
    }

    let playerUrl = playerMatch[1];

    // Fix relative URL
    if (playerUrl.startsWith("/")) {
        playerUrl = this.source.baseUrl + playerUrl;
    }

    console.log("PLAYER URL:", playerUrl);

    // STEP 5: Extract encoded video URL
    const vidMatch =
        playerUrl.match(/[?&]vid=([^&]+)/);

    if (!vidMatch) {

        console.log("VID PARAM NOT FOUND");

        return [];
    }

    let decodedUrl = "";

    try {

        decodedUrl = atob(
            decodeURIComponent(vidMatch[1])
        );

    } catch (e) {

        console.log("BASE64 DECODE ERROR:", e);

        return [];
    }

    console.log("DECODED VIDEO URL:", decodedUrl);

    // STEP 6: Build video list
    return [{
        url: decodedUrl,

        originalUrl: decodedUrl,

        quality:
            decodedUrl.includes(".m3u8")
                ? "HLS"
                : "MP4",

        headers: {

            // IMPORTANT:
            // Most of these CDNs require this exact referer
            "Referer": "https://nhplayer.com/",

            "Origin": new URL(decodedUrl).origin,

            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",

            "Accept": "*/*",

            "Accept-Language":
                "en-US,en;q=0.9"
        }
    }];
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
