class DefaultExtension extends MProvider {

    constructor() {
        super();

        this.client = new Client();

        this.baseUrl =
            "https://hentaini.com";
    }

    headers(referer) {

        return {

            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",

            "Referer":
                referer || this.baseUrl,

            "Origin":
                this.baseUrl,

            "Accept":
                "*/*"
        };
    }

    async request(url) {

        const res =
            await this.client.get(url, {

                headers:
                    this.headers(this.baseUrl)
            });

        return new Document(res.body);
    }

    async parseList(doc) {

        const list = [];

        // Hentaini cards
        const items =
            doc.select("a[href*='/watch/']");

        const seen =
            new Set();

        for (const item of items) {

            const link =
                item.attr("href");

            if (
                !link ||
                seen.has(link)
            ) continue;

            seen.add(link);

            let title = "";

            const titleEl =
                item.selectFirst("h2, h3, p");

            if (titleEl) {

                title =
                    titleEl.text
                        .replace(/\n/g, "")
                        .trim();
            }

            // fallback title
            if (!title) {

                const imgAlt =
                    item.selectFirst("img");

                if (imgAlt) {

                    title =
                        imgAlt.attr("alt") || "";
                }
            }

            let image = "";

            const img =
                item.selectFirst("img");

            if (img) {

                image =
                    img.attr("src") ||
                    img.attr("data-src") ||
                    img.attr("data-nuxt-img") ||
                    "";
            }

            // fix relative image
            if (
                image &&
                image.startsWith("/")
            ) {

                image =
                    this.baseUrl + image;
            }

            // fix relative link
            let fixedLink =
                link;

            if (
                fixedLink.startsWith("/")
            ) {

                fixedLink =
                    this.baseUrl +
                    fixedLink;
            }

            list.push({

                name:
                    title || "Unknown",

                imageUrl:
                    image,

                link:
                    fixedLink
            });
        }

        return list;
    }

    async getPopular(page) {

        const doc =
            await this.request(

                this.baseUrl +
                "/explore?page=" +
                page
            );

        const list =
            await this.parseList(doc);

        return {

            list,

            hasNextPage:
                list.length > 0
        };
    }

    async getLatestUpdates(page) {

        return await this.getPopular(page);
    }

    async search(query, page, filters) {

        const doc =
            await this.request(

                this.baseUrl +
                "/explore?search=" +
                encodeURIComponent(query) +
                "&page=" +
                page
            );

        const list =
            await this.parseList(doc);

        return {

            list,

            hasNextPage:
                list.length > 0
        };
    }

    async getDetail(url) {

        const doc =
            await this.request(url);

        let title =
            "Unknown";

        const titleEl =
            doc.selectFirst(
                "h1"
            );

        if (titleEl) {

            title =
                titleEl.text.trim();
        }

        let image = "";

        const poster =
            doc.selectFirst(
                "meta[property='og:image']"
            );

        if (poster) {

            image =
                poster.attr("content");
        }

        let description = "";

        const desc =
            doc.selectFirst(
                "meta[name='description']"
            );

        if (desc) {

            description =
                desc.attr("content");
        }

        const episodes = [];

        episodes.push({

            name:
                "Episode 1",

            url:
                url
        });

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

        // Open watch page
        const res =
            await client.get(url, {

                headers: {

                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",

                    "Referer":
                        this.baseUrl
                }
            });

        const html =
            res.body;

        const videos = [];

        const seen =
            new Set();

        // Find iframe
        const iframeMatch =
            html.match(

                /<iframe[^>]+src=["']([^"']+)["']/i
            );

        let iframeUrl = "";

        if (iframeMatch) {

            iframeUrl =
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
        }

        let playerHtml =
            html;

        // Open iframe if found
        if (iframeUrl) {

            const iframeRes =
                await client.get(
                    iframeUrl,
                    {

                        headers: {

                            "User-Agent":
                                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",

                            "Referer":
                                url
                        }
                    }
                );

            playerHtml =
                iframeRes.body;
        }

        // Extract mp4/m3u8 URLs
        const matches =
            [
                ...playerHtml.matchAll(

                    /https?:\/\/[^"'\\ ]+\.(mp4|m3u8)(\?[^"'\\ ]*)?/gi
                )
            ];

        for (const match of matches) {

            const videoUrl =
                match[0];

            if (
                seen.has(videoUrl)
            ) continue;

            seen.add(videoUrl);

            let quality =
                "Default";

            const q =
                videoUrl.match(
                    /([0-9]{3,4}p)/i
                );

            if (q) {

                quality =
                    q[1];
            }
            else if (
                videoUrl.includes("1080")
            ) {

                quality =
                    "1080p";
            }
            else if (
                videoUrl.includes("720")
            ) {

                quality =
                    "720p";
            }
            else if (
                videoUrl.includes("480")
            ) {

                quality =
                    "480p";
            }
            else if (
                videoUrl.includes(".m3u8")
            ) {

                quality =
                    "HLS";
            }

            videos.push({

                url:
                    videoUrl,

                originalUrl:
                    videoUrl,

                quality:
                    quality,

                headers: {

                    "Referer":
                        iframeUrl ||
                        this.baseUrl,

                    "Origin":
                        this.baseUrl,

                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",

                    "Accept":
                        "*/*",

                    "Accept-Encoding":
                        "identity;q=1, *;q=0",

                    "Range":
                        "bytes=0-",

                    "Connection":
                        "keep-alive"
                }
            });
        }

        // jwplayer fallback
        if (
            videos.length === 0
        ) {

            const jwMatch =
                playerHtml.match(

                    /file\s*:\s*["']([^"']+)["']/i
                );

            if (jwMatch) {

                const videoUrl =
                    jwMatch[1];

                videos.push({

                    url:
                        videoUrl,

                    originalUrl:
                        videoUrl,

                    quality:
                        "Default",

                    headers: {

                        "Referer":
                            iframeUrl ||
                            this.baseUrl,

                        "Origin":
                            this.baseUrl,

                        "User-Agent":
                            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36"
                    }
                });
            }
        }

        // highest quality first
        videos.sort((a, b) => {

            const qa =
                parseInt(a.quality) || 0;

            const qb =
                parseInt(b.quality) || 0;

            return qb - qa;
        });

        return videos;
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
