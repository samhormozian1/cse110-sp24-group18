import { setTimeout } from 'node:timers/promises';
const puppeteer = require('puppeteer');

describe('UI Comprehensive E2E Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: false }); // Set to false if you want to see the browser
    page = await browser.newPage();
    await page.goto('http://127.0.0.1:5501/src/index.html'); // Adjust URL to your local server
  });

  afterAll(async () => {
    // await browser.close();
  });

  // Splash screen
  it('Splash screen click', async () => {
    console.log('Checking for splash screen');

    // Check splash container
    let splashContainer = await page.$eval('div#splash-container', div => div.className || '');
    expect(splashContainer).toBe('');

    // Click the top left of the screen
    await page.mouse.click(0, 0);
    await setTimeout(500);

    // Recheck splash container
    splashContainer = await page.$eval('div#splash-container', div => div.className || '');
    expect(splashContainer).toBe('slide-up');
  });


  // Edit journal

  // Edit the title
  it('Editing the title of a journal', async () => {
    console.log('Editing title');

    // Check current title
    let titleHandle = await page.$('.title');
    let title = await page.evaluate(element => element.textContent, titleHandle);

    // Getting date and making sure the journal's date is correct    
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone });
    const currentDate = new Date(formatter.format(new Date()));
    const formattedDate = currentDate.toISOString().split('T')[0];
    expect(title).toBe(formattedDate);

    // Editing
    await titleHandle.click();
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA'); // Press 'A' key
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace'); // Press 'Backspace' key
    await page.keyboard.type('Today');

    await page.mouse.click(0, 0);

    // Rechecking
    titleHandle = await page.$('.title');
    title = await page.evaluate(element => element.textContent, titleHandle);

    expect(title).toBe('Today');
  });

  // Enter text to text editor, and change the fonts
  it('Testing the text editor', async () => {
    console.log('Testing the text editor');

    // Finding all the buttons (CURRENTLY UNABLE TO BE USED)
    // const boldBtn = await page.$('#bold-btn');
    // const underlineBtn = await page.$('#underline-btn');
    // const italicBtn = await page.$('#italic-btn');
    // const colorBtn = await page.$('#color-btn');
    
    let textboxHandler = await page.$('#content');
    let textbox = await page.evaluate(element => element.textContent, textboxHandler);

    expect(textbox).toBe('');

    // Editing
    // await boldBtn.click();
    await page.focus('#content');
    await page.keyboard.type('Text');
    // await boldBtn.click();

    // Rechecking the content
    textboxHandler = await page.$('#content');
    textbox = await page.evaluate(element => element.textContent, textboxHandler);

    expect(textbox).toBe('Text');

  });

  // Refresh and check that it remains
  it('Refreshing and making sure the changes remain', async () => {
    console.log('Refreshing and making sure the changes remain');

    await page.reload();
    await page.mouse.click(0, 0);
    await setTimeout(500);

    // Title
    const titleHandle = await page.$('.title');
    const title = await page.evaluate(element => element.textContent, titleHandle);

    expect(title).toBe('Today');
    
    // Content
    const textboxHandler = await page.$('#content');
    const textbox = await page.evaluate(element => element.textContent, textboxHandler);

    expect(textbox).toBe('Text');

    // On the sidebar
    const journalEntry = await page.$('.journalEntry');
    const span = await journalEntry.$('span');

    const textContent = await page.evaluate(el => el.textContent, span);

    expect(textContent).toBe(title);
  });

  // Change journal
  it('Changing journal', async () => {
    console.log('Changing journal');
    
    const journalEntry = await page.$$('.journalEntry');
    await journalEntry[1].click();

    // Title
    const titleHandle = await page.$('.title');
    const title = await page.evaluate(element => element.textContent, titleHandle);

    expect(title).toBe('Work Juggle');
    
    // Content
    const textboxHandler = await page.$('#content');
    const textbox = await page.evaluate(element => element.textContent, textboxHandler);

    expect(textbox).toBe('Feeling overwhelmed with work today. Didn\'t get much sleep, but managed to push through. Need to find a better balance!');
  });

  // Delete journal
  it('Deleting all and refreshing', async () => {
    console.log('Deleting all and refreshing');
    
    let journalEntries = await page.$$('.journalEntry');
    
    // Delete all
    while (journalEntries.length > 1) {
      const journalEntry = await page.$('.journalEntry');
      const del = await journalEntry.$('delbutton');
      const span = await del.$('span');
      await span.click();
      journalEntries = await page.$$('.journalEntry');
    }

    expect(journalEntries.length).toBe(1);

    // Try to delete the current date
    const journalEntry = await page.$('.journalEntry');
    const del = await journalEntry.$('delbutton');
    const span = await del.$('span');
    await span.click();

    // It can't be deleted
    expect(journalEntries.length).toBe(1);

    // Title
    const titleHandle = await page.$('.title');
    const title = await page.evaluate(element => element.textContent, titleHandle);

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const formatter = new Intl.DateTimeFormat('en-US', { timeZone });
    const currentDate = new Date(formatter.format(new Date()));
    const formattedDate = currentDate.toISOString().split('T')[0];
    expect(title).toBe(formattedDate);
    
    // Content
    const textboxHandler = await page.$('#content');
    const textbox = await page.evaluate(element => element.textContent, textboxHandler);

    expect(textbox).toBe('');
  });
  
  // Empty localhost
  it('Emptying Localhost and Bringing Back Placeholders', async () => {
    console.log('Emptying Localhost and Bringing Back Placeholders');
    let journalEntries = await page.$$('.journalEntry');

    expect(journalEntries.length).toBe(1);

    // Clearing local storage and reloading
    await page.evaluate(() => {
      localStorage.clear();
    });

    await page.reload();
    await page.mouse.click(0, 0);
    await setTimeout(500);

    // The placeholders should be there again
    journalEntries = await page.$$('.journalEntry');

    expect(journalEntries.length).toBe(12);
     
  });

  // Sort journal
  // April 4, May 5 2024
  // Earliest, Latest

  it('Sorting journals and checking them', async () => {
    console.log('Sorting journals and checking them');

    // Testing April
    await page.select('select[name="years"]', '2024');
    await page.select('select[name="months"]', 'April');
    
    let journalEntries = await page.$$('.journalEntry');
    expect(journalEntries.length).toBe(4);

    // Testing May
    await page.select('select[name="months"]', 'May');
    
    journalEntries = await page.$$('.journalEntry');
    expect(journalEntries.length).toBe(5);

    // Sort test earliest
    await page.evaluate(() => {
      const radio = document.querySelector('#earliest');
      radio.click();
    });

    let journalEntry = await page.$('.journalEntry'); // First should be Travel Day
    let span = await journalEntry.$('span');

    let textContent = await page.evaluate(el => el.textContent, span);

    expect(textContent).toBe('Travel Day');

    // Sort test latest
    await page.evaluate(() => {
      const radio = document.querySelector('#latest');
      radio.click();
    });

    journalEntry = await page.$('.journalEntry'); // First should be Power Outage Fun
    span = await journalEntry.$('span');

    textContent = await page.evaluate(el => el.textContent, span);

    expect(textContent).toBe('Power Outage Fun');
  });

  // Widgets
  // Look at summary, make sure default for new and constant for placeholders
  it('Look at summary', async () => {
    console.log('Look at summary');

    // When clicked, the summary will pop out
    const summaryHandler = await page.$('div[class="dropdown"]');
    const summaryBtn = await summaryHandler.$('button');
    await summaryBtn.click();

    const dropBoxes = await summaryHandler.$('div[class="dropdown-content show"]');
    const shown = dropBoxes ? true : false;

    expect(shown).toBe(true);

    // Check the first of the mood history to be neutral
    // Check the first of the hours of sleep to be 60%
    // Check the first of the code written to be 0

    // Also check for 1 of the placeholders
    
  });
  // (Test the burger)
  // Edit all 3 for today, look at summary
  // check all for mood and sleep, check +, -, and type for code

  
});
