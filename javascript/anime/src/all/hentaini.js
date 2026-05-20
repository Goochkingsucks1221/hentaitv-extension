class DefaultExtension extends MProvider {

    constructor() {
        super();

        this.client = new Client();

        this.baseUrl =
            "https://hentaini.com";
    }

    headers(referer) {

        return {

            "Referer":
                referer || "https://hentaini.com/",

            "Origin":
                "https://hentaini.com",

            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",

            "Accept":
                "*/*",

            "Accept-Language":
                "en-US,en;q=0.9",

            "Accept-Encoding":
                "gzip, deflate, br",

            "Connection":
                "keep-alive",

            "Sec-Fetch-Dest":
                "empty",

            "Sec-Fetch-Mode":
                "cors",

            "Sec-Fetch-Site":
                "cross-site"
        };
    }

    async request(url) {

        const res =
            await this.client.get(url, {

                headers:
                    this.headers(
                        this.baseUrl
                    )
            });

        return new Document(res.body);
    }

    async getPopular(page) {

        const doc =
            await this.request(

                `${this.baseUrl}/explore?page=${page}`
            );

        const list = [];

        const items =
            doc.select("a[href*='/h/']");

        const seen =
            new Set();

        for (const item of items) {

            let link =
                item.attr("href");

            if (!link)
                continue;

            if (
                link.startsWith("/")
            ) {

                link =
                    this.baseUrl +
                    link;
            }

            if (
                seen.has(link)
            ) continue;

            seen.add(link);

            const img =
                item.selectFirst("img");

            if (!img)
                continue;

            const image =
                img.attr("src") ||
                img.attr("data-src") ||
                "";

            let title =
                img.attr("alt") ||
                item.attr("title") ||
                "";

            title =
                String(title)
                    .replace(/^Watch\s+/i, "")
                    .replace(/\s+online\s+free$/i, "")
                    .trim();

            if (
                !title ||
                !image
            ) continue;

            list.push({

                name:
                    title,

                imageUrl:
                    image,

                link:
                    link
            });
        }

        return {

            list,

            hasNextPage:
                true
        };
    }

    async getLatestUpdates(page) {

        return await this.getPopular(page);
    }

    async search(query, page, filters) {

        const doc =
            await this.request(

                `${this.baseUrl}/explore?search=${encodeURIComponent(query)}&page=${page}`
            );

        const list = [];

        const items =
            doc.select("a[href*='/h/']");

        const seen =
            new Set();

        for (const item of items) {

            let link =
                item.attr("href");

            if (!link)
                continue;

            if (
                link.startsWith("/")
            ) {

                link =
                    this.baseUrl +
                    link;
            }

            if (
                seen.has(link)
            ) continue;

            seen.add(link);

            const img =
                item.selectFirst("img");

            if (!img)
                continue;

            const image =
                img.attr("src") ||
                img.attr("data-src") ||
                "";

            let title =
                img.attr("alt") ||
                item.attr("title") ||
                "";

            title =
                String(title)
                    .replace(/^Watch\s+/i, "")
                    .replace(/\s+online\s+free$/i, "")
                    .trim();

            if (
                !title ||
                !image
            ) continue;

            list.push({

                name:
                    title,

                imageUrl:
                    image,

                link:
                    link
            });
        }

        return {

            list,

            hasNextPage:
                true
        };
    }

    async getDetail(url) {

        const doc =
            await this.request(url);

        const title =
            doc.selectFirst("h1")
                ?.text ||

            doc.selectFirst("title")
                ?.text ||

            "Unknown";

        const image =
            doc.selectFirst(
                "meta[property='og:image']"
            )?.attr("content") ||

            doc.selectFirst("img")
                ?.attr("src") ||

            "";

        const description =
            doc.selectFirst(
                "meta[name='description']"
            )?.attr("content") ||

            "";

        const episodes =
            [];

        const epLinks =
            doc.select(
                "a[href*='/h/']"
            );

        const seen =
            new Set();

        for (const ep of epLinks) {

            let epUrl =
                ep.attr("href") || "";

            if (!epUrl)
                continue;

            if (
                !/\/h\/.+\/\d+/.test(epUrl)
            ) continue;

            if (
                epUrl.startsWith("/")
            ) {

                epUrl =
                    this.baseUrl +
                    epUrl;
            }

            if (
                seen.has(epUrl)
            ) continue;

            seen.add(epUrl);

            let epName =
                ep.selectFirst(
                    "span.text-white"
                )?.text ||

                ep.text ||

                "Episode";

            epName =
                epName
                    .replace(/\n/g, "")
                    .trim();

            episodes.push({

                name:
                    epName,

                url:
                    epUrl
            });
        }

        if (
            episodes.length === 0
        ) {

            episodes.push({

                name:
                    "Episode 1",

                url:
                    url
            });
        }

        return {

            name:
                title,

            imageUrl:
                image,

            description:
                description,

            episodes:
                episodes
        };
    }

    async getVideoList(url) {

    const client =
        new Client();

    // OPEN PAGE
    const res =
        await client.get(url, {

            headers:
                this.headers(
                    this.baseUrl
                )
        });

    const html =
        res.body;

    let streamUrl =
        "";

    // DIRECT m3u8
    const direct =
        html.match(

            /https?:\/\/[^"' ]+\.m3u8[^"' ]*/i
        );

    if (direct) {

        streamUrl =
            direct[0];
    }

    // IFRAME FALLBACK
    if (!streamUrl) {

        const iframeMatch =
            html.match(

                /<iframe[^>]+src=["']([^"']+)["']/i
            );

        if (!iframeMatch) {

            return [];
        }

        let iframeUrl =
            iframeMatch[1];

        if (
            iframeUrl.startsWith("//")
        ) {

            iframeUrl =
                "https:" +
                iframeUrl;
        }

        if (
            iframeUrl.startsWith("/")
        ) {

            iframeUrl =
                this.baseUrl +
                iframeUrl;
        }

        const iframeRes =
            await client.get(
                iframeUrl,
                {

                    headers:
                        this.headers(url)
                }
            );

        const iframeHtml =
            iframeRes.body;

        const iframeM3u8 =
            iframeHtml.match(

                /https?:\/\/[^"' ]+\.m3u8[^"' ]*/i
            );

        if (iframeM3u8) {

            streamUrl =
                iframeM3u8[0];
        }
    }

    if (!streamUrl) {

        return [];
    }

    console.log(
        "STREAM:",
        streamUrl
    );

    return [

        {

            url:
                streamUrl,

            originalUrl:
                streamUrl,

            quality:
                "1080p",

            // IMPORTANT
            videoType:
                "m3u8",

            headers: {

                "Referer":
                    "https://hentaini.com/",

                "Origin":
                    "https://hentaini.com",

                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",

                "Accept":
                    "*/*",

                "Accept-Language":
                    "en-US,en;q=0.9",

                "Accept-Encoding":
                    "gzip, deflate, br",

                "Connection":
                    "keep-alive"
            }
        }
    ];
}

    async getPageList() {

        throw new Error(
            "Not manga source"
        );
    }

    getFilterList() {

        return [];
    }

    getSourcePreferences() {

        return [];
    }
}

extension =
    new DefaultExtension();
