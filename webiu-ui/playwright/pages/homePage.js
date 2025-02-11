class HomePage {
    constructor(page) {
        this.page = page;
    }

    async visit() {
        await this.page.goto('/');
    }
}

export default HomePage;