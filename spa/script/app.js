

Alpine.store("settings", {
    apiBaseUrl:"http://172.17.100.14:3329/usa2/api",  
    appName: "contact application",  
   
});


Alpine.store("GlobalVariable", {
    //contacts:Alpine.reactive([]),
    contacts:Alpine.reactive({ 
        data: [], 
        total: 0,         
    }),
    queryParams: Alpine.reactive({}), // Keep query parameters reactive
});


Alpine.store("GlobalFunctions", { 
    findContactById(id) {        
        let contacts = Alpine.store("GlobalVariable").contacts.data; // Ensure `data` is always an array
        let foundContact = contacts.find(c => Number(c.id) === Number(id));
        
        if (foundContact) {
            return {...foundContact }; // Creates a new object to trigger reactivity
        } else {
            return {}; // Returns an empty object if not found
        }
        
    }
});

