import puppeteer from 'puppeteer';
import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import path from 'path';
import { expect } from 'chai';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tell linter these functions exist.
/*global beforeAll, afterAll, expect*/
describe("Journal Page", () => {
    let browser;
    let page;
    let server;

    const fastify = Fastify();

    beforeAll(async function () {
        fastify.register(staticPlugin, {
            root: path.join(__dirname, "../../") // Adjust the path to your project's root if needed
        });

        server = fastify;
        await server.listen({
            port: 6790
        });

        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        page = await browser.newPage();
        await page.goto("http://localhost:6790/journal.html"); // Adjust the path to your HTML file
    }, 30000);

    afterAll(async () => {
        await browser.close();
        await server.close();
    });

    it("should display the modal upon clicking add new task", async () => {
        // Check if the modal is visible
        const isModalVisible = await page.evaluate(() => {
            const journalBody = document.querySelector("body");
            const newModal = document.createElement("modal-journal");
            journalBody.appendChild(newModal);
            const shadow = document.querySelector("modal-journal");
            const modal = shadow.shadowRoot.querySelector('.modal');
            const style = window.getComputedStyle(modal);
            return style.display !== 'none';
        });

        expect(isModalVisible).to.equal(true);

        await page.evaluate(() => {
            const shadow = document.querySelector("modal-journal");
            shadow.remove();
        });
    });
  
    test("should not have any journal to display", async () => {
        // Check that no journal is displayed
        const noJournalMessage = await page.evaluate(() => {
            const editor = document.querySelector("journal-editor");
            const message = editor.shadowRoot.querySelector('p');
            return message.innerText == 'No journal selected';
        });

        expect(noJournalMessage).to.equal(true);
    });
    
    test("journal editor should display when data is set", async () => {
        // Check that editor is displayed
        const editorDisplayed = await page.evaluate(() => {
            const editor = document.querySelector("journal-editor");

            const entry = {
                title: "Journal Title",
                tags: ["tag1", "tag2"],
                path: "path/to/journal",
				content: "# hello"
            };

            editor.data = entry;

            const title = editor.shadowRoot.getElementById('journal-title');
            if (title.hidden) return false;
            if (title.value != entry.title) return false;
            
            const tags = editor.shadowRoot.getElementById('journal-tags');
            if (tags.hidden) return false;
            if (tags.value != entry.tags.join(', ')) return false;

			const text = editor.shadowRoot.getElementById('text-editor');
			if (text.hidden) return false;
			if (text.value != "# hello") return false;

            return true;
        });

        expect(editorDisplayed).to.equal(true);
    });
});