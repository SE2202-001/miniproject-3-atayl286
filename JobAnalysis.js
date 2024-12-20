const input = document.getElementById("input"); // The input element for retrieving a .JSON from the user.

// Table and children:
const table = document.getElementById("table");
const tHead = document.getElementById("thead");
const tBody = document.getElementById("tbody");

// Dropdown menus:
const levelDrop = document.getElementById("levels");
const typeDrop = document.getElementById("types");
const skillDrop = document.getElementById("skills");

let jsonData = []; // Will contain the raw .JSON array of objects.
let processedData = []; // Will contain the processed .JSON array, with instances of Job.

const reader = new FileReader(); // Used to read the input file.

// Filter dropdown options:
const levels = new Set();
const types = new Set();
const skills = new Set();

/**
 * Represents a job listing.
 */
class Job {
    // Private properties:
    #title;
    #type;
    #level;
    #skill;
    #desc;
    #posted;
    #link;

    /**
     * Constructor for Job.
     * @param {string} title This job's title.
     * @param {string} type This job's duration type.
     * @param {string} level This job's level of difficulty.
     * @param {string} skill This job's skillset requirements.
     * @param {string} desc This job's description ("detail" in the original object).
     * @param {string} posted This job's time since posted.
     * @param {string} link This job's link for further information.
     */
    constructor(title, type, level, skill, desc, posted, link) {
        this.#title = title;
        this.#type = type;
        this.#level = level;
        this.#skill = skill;
        this.#desc = desc;
        this.#posted = posted;
        this.#link = link;
    }

    /**
     * Getter for #title.
     */
    get title() {
        return this.#title;
    }

    /**
     * Getter for #type.
     */
    get type() {
        return this.#type;
    }

    /**
     * Getter for #level.
     */
    get level() {
        return this.#level;
    }

    /**
     * Getter for #skill.
     */
    get skill() {
        return this.#skill;
    }

    /**
     * Getter for #desc.
     */
    get desc() {
        return this.#desc;
    }

    /**
     * Getter for #posted.
     */
    get posted() {
        return this.#posted;
    }

    /**
     * Getter for #link.
     */
    get link() {
        return this.#link;
    }

    /**
     * Converts #posted into a number measured in minutes.
     */
    get formattedPostedTime() {
        let timeText = this.posted.split(" "); // Splits the original string at each whitespace, making [0] the number and [1] hours or minutes.
        let time = Number(timeText[0]);

        // Returns the proper converted time if the orignal string is measured in hours; if the format is incorrect returns undefined.
        if (timeText[1] === "hours" || timeText[1] === "hour") {
            time *= 60;
            return time;
        } else if (timeText[1] === "minute" || timeText[1] === "minutes") {
            return time;
        } else {
            return undefined;
        }
    }
}

input.addEventListener( "input", (e) => {reader.readAsText(input.files[0]);} ); // When a file is inputted, immediately process the file.

/**
 * Overrides the default reader.onload() function to process the .JSON file.
 */
reader.onload = function() {
    let validJson = false;
    let validObj = true;

    // Skips all processing if the .JSON is broken.
    try {
        jsonData = JSON.parse(reader.result);
        validJson = true;
    } catch {

    }

    // If the .JSON is valid and contains an array, process the data. If not, alert the user and do not process.
    if(validJson && Array.isArray(jsonData)) {
        for (obj of jsonData) {

            // If the current 'obj' is a proper object, with defined properties in each required field, create a new Job object.
            if (typeof obj === "object") {
                if (obj["Title"] !== undefined && obj["Type"] !== undefined && obj["Level"] !== undefined && obj["Skill"] !== undefined && obj["Detail"] !== undefined && obj["Posted"] !== undefined && obj["Job Page Link"] !== undefined) {
                    let job = new Job(obj["Title"], obj["Type"], obj["Level"], obj["Skill"], obj["Detail"], obj["Posted"], obj["Job Page Link"]);

                    // If this Job object's time is in the correct format, add the Job to the array of processed data and update the dropdown Sets to reflect it's properties.
                    if (job.formattedPostedTime !== undefined) {
                        levels.add(job.level);
                        types.add(job.type);
                        skills.add(job.skill);
                        processedData.push(job);
                    } else {
                        validObj = false;
                    }
                    
                } else {
                    validObj = false;
                }
            } else {
                validObj = false;
            }
        }

        // If an invalid object was contained in the .JSON, alert the user.
        if (!validObj) {
            window.alert("One or more objects included in the .JSON are invalid, so some objects may be skipped over. Please correct your file.")
        }

        // Update each dropdown to reflect it's corresponding set:

        for (level of levels) {
            levelDrop.options[levelDrop.options.length] = new Option(level, level);
        }

        for (type of types) {
            typeDrop.options[typeDrop.options.length] = new Option(type, type);
        }

        for (skill of skills) {
            skillDrop.options[skillDrop.options.length] = new Option(skill, skill);
        }

        updateTable();

    } else {
        window.alert("Invalid or broken .JSON file uploaded. Please try again with a different file.");
    }
};

/**
 * Updates the contents of the table, taking into account the sort and filter choices by the user.
 */
function updateTable() {
    let comparator = document.getElementById("sort").value;
    let filters = [document.getElementById("levels").value, document.getElementById("types").value, document.getElementById("skills").value];

    // Determines the correct comparator function to sort by.
    if (comparator === "za") {
        comparator = sortZA;
    } else if (comparator === "newest") {
        comparator = sortNewest;
    } else if (comparator === "oldest") {
        comparator = sortOldest;
    } else {
        comparator = sortAZ;
    }

    processedData.sort(comparator); // Sorts the array of Jobs via a comparator.

    let ogRows = tBody.rows.length;

    // Clears the table.
    for (let i = 0; i < ogRows; i++) {
        tBody.deleteRow(0);
    }

    // With respect to all selected filters, adds each Job to the table in a row with a separate cell per object property.
    for (job of processedData) {
        if ((job.level === filters[0] || filters[0] === "No filter") && (job.type === filters[1] || filters[1] === "No filter") && (job.skill === filters[2] || filters[2] === "No filter")) {
            let row = tBody.insertRow();
            row.insertCell().innerHTML = job.title;
            row.insertCell().innerHTML = job.type;
            row.insertCell().innerHTML = job.level;
            row.insertCell().innerHTML = job.skill;
            row.insertCell().innerHTML = job.desc;
            row.insertCell().innerHTML = job.posted;
        }
    }
}

/**
 * Comparator to sort descending alphabetically.
 * @param {Job} a The first Job object to compare.
 * @param {Job} b The second Job object to compare.
 * @returns 1 if 'a' comes first, -1 if 'b' does, and 0 if they are equal.
 */
function sortAZ(a, b) {
    if (a.title > b.title) {
        return 1;
    } else if (a.title < b.title) {
        return -1;
    } else {
        return 0;
    }
}

/**
 * Comparator to sort alphabetically, ascending.
 * @param {Job} a The first Job object to compare.
 * @param {Job} b The second Job object to compare.
 * @returns 1 if 'b' comes first, -1 if 'a' does, and 0 if they are equal (the opposite of sortAZ).
 */
function sortZA(a, b) {
    if (a.title > b.title) {
        return -1;
    } else if (a.title < b.title) {
        return 1;
    } else {
        return 0;
    }
}

/**
 * Comparator function to sort by posted time, ascending.
 * @param {Job} a The first Job object to compare.
 * @param {Job} b The second Job object to compare.
 * @returns Positive if 'a' is newer, negative if 'b' is, and 0 if they are equal.
 */
function sortNewest(a, b) {
    return a.formattedPostedTime - b.formattedPostedTime;
}


/**
 * Comparator function to sort by posted time, descending.
 * @param {Job} a The first Job object to compare.
 * @param {Job} b The second Job object to compare.
 * @returns Positive if 'a' is older, negative if 'b' is, and 0 if they are equal.
 */
function sortOldest(a, b) {
    return b.formattedPostedTime - a.formattedPostedTime;
}