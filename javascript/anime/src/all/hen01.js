class DefaultExtension extends MProvider {
    constructor() {
        super();
        this.client = new Client();
    }

    headers(referer = "https://hen01.top/") {
        return {
            "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
            "Referer": referer,
            "Origin": "https://hen01.top",
            "Accept": "*/*",
            "Connection": "keep-alive"
        };
    }

    async request(url) {
        const res = await this.client.get(url, {
            headers: this.headers()
        });

        return new Document(res.body);
    }

    async getPopular(page) {
        return {
            list: [],
            hasNextPage: false
        };
    }

    async getLatestUpdates(page) {
        return {
            list: [],
            hasNextPage: false
        };
    }

    async search(query, page, filters) {
        return {
            list: [],
            hasNextPage: false
        };
    }

    async getDetail(url) {

        return {
            name: "Video",
            imageUrl: "",
            description: "",
            episodes: [
                {
                    name: "Episode 1",
                    url: url
                }
            ]
        };
    }

    async getVideoList(url) {

        const playlistRes = await this.client.get(url, {
            headers: this.headers(url)
        });

        const playlist = playlistRes.body;

        const lines = playlist.split("\n");

        const videos = [];

        for (const line of lines) {

            const stream = line.trim();

            if (
                stream.startsWith("http") &&
                stream.includes(".webp")
            ) {

                videos.push({
                    url: stream,
                    originalUrl: stream,
                    quality: "720p",
                    headers: this.headers(url)
                });
            }
        }

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
