
const DB_NAME = "budget";
const VERSION = 2;

let db;
const request = indexedDB.open(DB_NAME, VERSION);

// setup methods for initial creation
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};
request.onsuccess = function(event) {

    // update global
    db = event.target.result;

    // make sure online
    if (navigator.onLine) 
        checkDatabase();
};
request.onerror = function(event) {
  console.log("ERROR: " + event.target.errorCode);
};

/**
 * 
 * @param {object} record 
 */
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // access your pending object store
  const store = transaction.objectStore("pending");

  // add record to your store with add method.
  store.add(record);
}

/**
 * 
 */
function checkDatabase(cb) {
  // open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const store = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {

      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        // if successful, open a transaction on your pending db
        const transaction = db.transaction(["pending"], "readwrite");

        // access your pending object store
        const store = transaction.objectStore("pending");

        // clear all items in your store
        store.clear();
      });
    }

    // run callback if needed (this is used when manipulating funds)
    if (cb) cb();
  };
}

// listen for app coming back online
// changed to anonymous to force no callback
window.addEventListener("online", () => { checkDatabase() });
