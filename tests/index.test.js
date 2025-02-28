const axios2 = require("axios");
const WebSocket = require("ws");

const axios = {
    post: async(...args) => {
        try {
            const res = await axios2.post(...args);
            return res;
        } catch (error) {
            return error.response;
        }
    },
    put: async(...args) => {
        try {
            const res = await axios2.put(...args);
            return res
        } catch (error) {
            return error.response;
        }
    },
    get: async(...args) => {
        try {
            const res = await axios2.get(...args);
            return res
        } catch (error) {
            return error.response;
        }
    },
    delete: async(...args) => {
        try {
            const res = await axios2.delete(...args);
            return res
        } catch (error) {
            return error.response;
        }
    },  
};

const BACKEND_URL = "http://localhost:3000";
const WEBSOCKET_URL = "ws://localhost:3001";

describe.skip('Authentication Tests', () => { 
    test('User is Able to Signup', async() => { 
        let username = "mudu" + Math.random();
        let password = "muduvau123@"; 
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        });

        expect(response.status).toBe(200);
    });

    test('Username Already exists',async()=>{
        let username = "mudu" + Math.random();
        let password = "muduvau123@";
        await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        });

        expect(response.status).toBe(400);

    });

    test('Password should be atleast 8 characters long', async () => { 
        let username = "mudu" + Math.random();
    
        const response = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password: "mudu",
            type: "admin"
        });

        expect(response.status).toBe(400);
    });

     test('User is able to login and obtain a token', async () => { 
        let username = "mudu" + Math.random();
        let password = "muduvau123@";

        await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })
        
        expect(response.status).toBe(200);
        expect(response.data.token).toBeDefined();
        
    });

    test('User is unable to login if password is incorrect', async () => { 
        let username = "mudu" + Math.random();
        let password = "muduvau123@";

        await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password: "abeychal123@ABEY"
        })
        
        expect(response.status).toBe(400);
               
    });
     
});

describe.skip('User Endpoint Tests', () => { 
    let token = "";
    let avatarId = "";
    beforeAll(async() => {
        let username = "mudu" + Math.random();
        let password = "muduvau123@";

        await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })
        
        token = response.data.token;

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            name: "Melody",
            avatarImg: "https://seeklogo.com/images/M/my_melody-logo-42B1DE4CAD-seeklogo.com.png"
        },{
            headers: {
                authorization: `Bearer ${token}`
            }
        });

        avatarId = avatarResponse.data.avatarId;
        
    })
    
    test('User is able to update metadata with correct avatar id', async () => { 
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: avatarId
        },{
            headers:{
                authorization: `Bearer ${token}`
            }
        })

        expect(response.status).toBe(200);
    });

    test('User is unable to update metadata with incorrect avatar id', async () => { 
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: "sjndajsn123"
        },{
            headers:{
                authorization: `Bearer ${token}`
            }
        })

        expect(response.status).toBe(400);
    });

    test('User is unable to update metadata without auth header', async () => { 
        const response = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: avatarId
        })

        expect(response.status).toBe(401);
    });
});

describe.skip('User Avatar Information', () => { 
    let avatarId = "";
    let userId = "";
    let token  = "";
    beforeAll(async() => {
        let username = "mudu" + Math.random();
        let password = "muduvau123@";

        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "admin"
        });

        userId = signupResponse.data.userId;

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        token = response.data.token;

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            name: "Melody",
            avatarImg: "https://w7.pngwing.com/pngs/147/288/png-transparent-pixelated-yellow-star-minecraft-super-mario-bros-pixel-art-pixel-art-text-super-mario-bros-symmetry-thumbnail.png"
        },{
            headers: {
                authorization: `Bearer ${token}`
            }
        })

        avatarId = avatarResponse.data.avatarId;

        const metadataUpdateResponse = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: avatarId
        },{
            headers:{
                authorization: `Bearer ${token}`
            }
        })

    });

    test('User is able to find avatars of other users', async () => { 
        const response = await axios.get(`${BACKEND_URL}/api/v1/user/metadata/bulk?ids=[${userId}]`,
            {
                headers:{
                    authorization: `Bearer ${token}`
                }
            }
        );
       

        expect(response.data.avatars.length).toBe(1);
        expect(response.data.avatars[0].userId).toBe(userId);
    });

    test('User is able to find the recently added avatar' , async () => { 
        const response = await axios.get(`${BACKEND_URL}/api/v1/avatars`);

        expect(response.data.avatars.length).not.toBe(0);
        const currentAvatar = response.data.avatars.find(x => x.id == avatarId);
        expect(currentAvatar).toBeDefined();
    });
});

describe.skip('Space Information Endpoints', () => {
    
    let mapId = "";
    let element1Id = "";
    let element2Id = "";

    let adminToken = "";
    let adminId = "";
    
    let userToken = "";
    let userId = "";


    beforeAll(async() => {

        let username = "mudu" + Math.random();
        let password = "muduvau123@";

        //admin authentication:
        const adminSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + "-admin",
            password,
            type: "admin"
        });

        adminId = adminSignup.data.userId;

        const adminSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-admin",
            password
        })
        
        adminToken = adminSignin.data.token;

        //user authentication:
        const userSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + "-user",
            password: password,
            type: "user"
        });

        userId = userSignup.data.userId;

        const userSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password: password
        })
        
        userToken = userSignin.data.token;

        //element creation:
        const element1 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name: "Chair1",
            width: 2,
            height: 2,
	        elementImg: "https://e7.pngegg.com/pngimages/912/409/png-clipart-pixelated-penguin-illustration-pixel-penguin-pixel-art-pixel-art-game-animals-thumbnail.png",
	        static: false
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        })

        element1Id = element1.data.elementId;

        const element2 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name:"Chair2",
            width:8,
            height:10,
	        elementImg: "https://static.vecteezy.com/system/resources/previews/025/212/486/non_2x/an-8-bit-retro-styled-pixel-art-illustration-of-a-purple-crystal-free-png.png",
	        static: true
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        element2Id = element2.data.elementId;

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
            name : "Crazy Map",
            thumbnail: "https://wallpapers.com/images/hd/pixel-game-3mt15l3duvd9nh97.jpg",
            dimensions: "100x100",
            bgImg: "https://cdn.wikimg.net/en/strategywiki/images/9/9a/Pokemon_FRLG_Route_7.png",
            defaultElements: [{
                elementId: element1Id,
                x: 10,
                y: 20
            },{
                elementId: element2Id,
                x: 30,
                y: 40
            }]
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        mapId = mapResponse.data.mapId;
    });

    test('User is able to create a space', async () => { 
        const response = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            dimensions: "50x50",
            mapId : mapId
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(200);
        expect(response.data.spaceId).toBeDefined();
    });
    
    test('User is able to create a space without any dimensions', async () => { 
        const response = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            mapId : mapId
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(200);
        expect(response.data.spaceId).toBeDefined();
    });

    test('User is able to create a space without Map Id (empty space)', async () => { 
        const response = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            dimensions: "500x500"
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(200);
        expect(response.data.spaceId).toBeDefined();
    });

    test('User is unable to create a space without Map Id and dimensiosn', async () => { 
        const response = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(400);
    });

    test('User is able to delete an existing space', async () => { 
        const response = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            dimensions: "200x200",
            mapId
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })
        
        const spaceId = response.data.spaceId;

        const deleteResponse = await axios.delete(`${BACKEND_URL}/api/v1/spaces/${spaceId}`,{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });
    
        expect(deleteResponse.status).toBe(200);
    });

    test('User is unable to delete a space created by another user', async () => {
        
        let username = "mudit" + Math.random()*10;
        let password = "muduvau123@";

        await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username,
            password,
            type: "user"
        });

        const userSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })
        
        let user2Token = userSignin.data.token;
        
        const response = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            dimensions: "200x100",
            mapId
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        const spaceId = response.data.spaceId;

        const deleteResponse = await axios.delete(`${BACKEND_URL}/api/v1/spaces/${spaceId}`,{
            headers:{
                authorization: `Bearer ${user2Token}`
            }
        });

        expect(deleteResponse.status).toBe(403);
    })

    test('Admin initially has 0 spaces initially', async() => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/spaces/all`,{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });
        expect(response.data.spaces.length).toBe(0);
    })

    test('Admin can create a space', async () => {
        const spaceCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            dimensions: "100x200",
            mapId : mapId
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        })
        
        const spaceId = spaceCreateResponse.data.spaceId;
        const response = await axios.get(`${BACKEND_URL}/api/v1/spaces/all`,{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });
        
        const filteredResponse = response.data.spaces.find(x => x.id == spaceId);
        expect(response.data.spaces.length).toBe(1);
        expect(filteredResponse).toBeDefined();
        
    })
    
});

describe.skip('Space Endpoints', () => { 
    let mapId = "";
    let element1Id = "";
    let element2Id = "";
    let spaceId = "";

    let adminToken = "";
    let adminId = "";
    
    let userToken = "";
    let userId = "";


    beforeAll(async() => {

        let username = "mudu" + Math.random();
        let password = "muduvau123@";

        //admin authentication:
        const adminSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + "-admin",
            password,
            type: "admin"
        });

        adminId = adminSignup.data.userId;

        const adminSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-admin",
            password: password
        })
        
        adminToken = adminSignin.data.token;

        //user authentication:
        const userSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + "-user",
            password,
            type: "user"
        });

        userId = userSignup.data.userId;

        const userSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password
        })
        
        userToken = userSignin.data.token;

        //element creation:
        const element1 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name: "Chair1",
            width: 2,
            height: 2,
	        elementImg: "https://e7.pngegg.com/pngimages/912/409/png-clipart-pixelated-penguin-illustration-pixel-penguin-pixel-art-pixel-art-game-animals-thumbnail.png",
	        static: false
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        })

        element1Id = element1.data.elementId;

        const element2 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name:"Chair2",
            width:8,
            height:10,
	        elementImg: "https://static.vecteezy.com/system/resources/previews/025/212/486/non_2x/an-8-bit-retro-styled-pixel-art-illustration-of-a-purple-crystal-free-png.png",
	        static: true
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        element2Id = element2.data.elementId;

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
            name : "Crazy Map",
            thumbnail: "https://wallpapers.com/images/hd/pixel-game-3mt15l3duvd9nh97.jpg",
            dimensions: "100x100",
            bgImg: "https://cdn.wikimg.net/en/strategywiki/images/9/9a/Pokemon_FRLG_Route_7.png",
            defaultElements: [{
                elementId: element1Id,
                x: 10,
                y: 20
            },{
                elementId: element2Id,
                x: 30,
                y: 40
            }]
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        mapId = mapResponse.data.mapId;

        const spaceCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            mapId : mapId,
            dimensions: "70x50" 
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        spaceId = spaceCreateResponse.data.spaceId;
        
    });
    
    test('Correct Space Id returns all information about that space', async () => { 
        const response = await axios.get(`${BACKEND_URL}/api/v1/spaces/${spaceId}`,{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });
        
        const width = response.data.dimensions.split('x')[0];
        const height = response.data.dimensions.split('x')[1];

        expect(width).toBe("70");
        expect(height).toBe("50");
        expect(response.data.elements.length).toBe(2);
    });
    
    test('Incorrect Space Id returns 400', async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/spaces/incorrect`,{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });

        expect(response.status).toBe(400);
    });
    
    test('Adding element works as expected', async () => {
        const elementResponse = await axios.post(`${BACKEND_URL}/api/v1/spaces/elements`,{

            elementId: element2Id,
            spaceId: spaceId,
            x:40,
            y:23
            
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        const spaceResponse = await axios.get(`${BACKEND_URL}/api/v1/spaces/${spaceId}`,{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });
        
        expect(spaceResponse.data.elements.length).toBe(3);
    });
    
    test('Element cannot be added outisde dimensions', async () => { 
        const elementResponse = await axios.post(`${BACKEND_URL}/api/v1/spaces/elements`,{
            element:{
                elementId: element2Id,
                spaceId: spaceId,
                x:100000,
                y:231313
            },
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        expect(elementResponse.status).toBe(400);
    });

    test('Deleting an element works as expected', async () => { 

        const spaceResponse = await axios.get(`${BACKEND_URL}/api/v1/spaces/${spaceId}`,{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });   
        
        const oldLength = spaceResponse.data.elements.length;

        const deleteResponse = await axios.post(`${BACKEND_URL}/api/v1/spaces/elements/delete`,{
            spaceId: spaceId,
            spaceElementId: spaceResponse.data.elements[0].id
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });

        expect(deleteResponse.status).toBe(200);
        const newSpaceResponse = await axios.get(`${BACKEND_URL}/api/v1/spaces/${spaceId}`,{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });
        
        expect(newSpaceResponse.data.elements.length).toBe(oldLength-1);

    });
    
});

describe('Admin Endpoints', () => { 
    let mapId = "";
    let element1Id = "";
    let element2Id = "";

    let adminToken = "";
    let adminId = "";
    
    let userToken = "";
    let userId = "";
    

    beforeAll(async() => {

        let username = "mudu" + Math.random();
        let password = "muduvau123@";

        //admin authentication:
        const adminSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + "-admin",
            password,
            type: "admin"
        });

        adminId = adminSignup.data.userId;
        console.log("admin Id:",adminId);

        const adminSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-admin",
            password: password
        })
        
        adminToken = adminSignin.data.token;
        console.log("admin Token:",adminToken);

        //user authentication:
        const userSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + "-user",
            password,
            type: "user"
        });

        userId = userSignup.data.userId;
        console.log("user Id:",userId);

        const userSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password
        })
        
        userToken = userSignin.data.token;
        console.log("user Token:",userToken);

        //element creation:
        const element1 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name: "Chair1",
            width: 2,
            height: 2,
	        elementImg: "/assets/crystal.png",
	        static: false
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        })

        element1Id = element1.data.elementId;

        const element2 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name:"Chair2",
            width:8,
            height:10,
	        elementImg: "/assets/table.png",
	        static: true
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        element2Id = element2.data.elementId;

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
            name : "Crazy Map",
            thumbnail: "https://wallpapers.com/images/hd/pixel-game-3mt15l3duvd9nh97.jpg",
            dimensions: "100x100",
            bgImg: "/assets/background.jpg",
            defaultElements: [{
                elementId: element1Id,
                x: 10,
                y: 20
            },{
                elementId: element2Id,
                x: 30,
                y: 40
            }]
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        mapId = mapResponse.data.mapId;

        const spaceCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            mapId : mapId,
            dimensions: "20x20" 
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });

        spaceId = spaceCreateResponse.data.spaceId;
        console.log("Space Id:",spaceId);

        const avatarResponse1 = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            name: "Hello Kitty",
            avatarIdle: "/assets/Bob_idle_anim_16x16.png",
            avatarRun: "/assets/Bob_run_16x16.png"
        },{
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const avatarResponse2 = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            name: "Kuromi",
            avatarIdle: "/assets/Adam_idle_anim_16x16.png",
            avatarRun: "/assets/Adam_run_16x16.png"
        },{
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        console.log(avatarResponse2.data.message);


        const avatarUpdateResponse = await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: avatarResponse1.data.avatarId
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        console.log(avatarUpdateResponse.data.message);

        await axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: avatarResponse2.data.avatarId
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

    });

    test('User is not able to hit admin endpoints', async () => { 
        //element response:
        const elementCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name: "Chair 1",
            width: 2,
            height: 2,
	        elementImg: "https://google.com/chair.png",
	        static: false
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });

        const elementUpdateResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/${elementCreateResponse.data.elementId}`,{
            elementImg: "https://google.com/chair.png"
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });

        //map response:
        const mapCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
            name: "test-Map",
            thumbnail: "https://google.com/avatar.png",
            dimensions: "100x200",
            bgImg: "https://bruh.png",
            defaultElements: []
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        })

        //avatar response:
        const avatarCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            name: "Melody",
            avatarImg: "https://google.com/avatar.png"
        },{
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        expect(elementCreateResponse.status).toBe(403);
        expect(elementUpdateResponse.status).toBe(403);
        expect(mapCreateResponse.status).toBe(403);
        expect(avatarCreateResponse.status).toBe(403);
        
    });
    
    test.skip('Admin is able to hit admin endpoints', async () => { 
        //element response:
        const elementCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name: "Chair 1",
            width: 2,
            height: 2,
	        elementImg: "https://opengameart.org/sites/default/files/styles/medium/public/silla_0.png",
	        static: false
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        })

        const elementUpdateResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/${elementCreateResponse.data.elementId}`,{
            elementImg: "https://opengameart.org/sites/default/files/styles/medium/public/table_8.png"
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        //map response:
        const mapCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
            name : "Crazy Map",
            thumbnail: "https://wallpapers.com/images/hd/pixel-game-3mt15l3duvd9nh97.jpg",
            dimensions: "100x100",
            bgImg: "https://cdn.wikimg.net/en/strategywiki/images/9/9a/Pokemon_FRLG_Route_7.png",
            defaultElements: [{
                elementId: element1Id,
                x: 10,
                y: 20
            },{
                elementId: element2Id,
                x: 30,
                y: 40
            }]
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        //avatar response:
        const avatarCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            name: "Melody",
            avatarImg: "https://google.com/chair.png"
        },{
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const avatarUpdateResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/avatar/${avatarCreateResponse.data.avatarId}`,{
            avatarImg: "https://google.com/chair.png"
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });
        
        expect(elementCreateResponse.status).toBe(200);
        expect(elementUpdateResponse.status).toBe(200);
        expect(mapCreateResponse.status).toBe(200);
        expect(avatarCreateResponse.status).toBe(200);
        expect(avatarUpdateResponse.status).toBe(200);
    });
});

describe.skip('Websocket tests', () => { 
    let userId;
    let userToken;
    let adminId;
    let adminToken;

    let element1Id;
    let element2Id;

    let mapId;
    let spaceId;

    let ws1;
    let ws2;

    let ws1Messages = [];
    let ws2Messages = [];

    let adminX = 0;
    let adminY = 0;
    let userX = 0;
    let userY = 0;
    
    function waitForAndPopLatestMessage(messagesArray){
        return new Promise(resolve => {
            if(messagesArray.length>0){
                resolve(messagesArray.pop());
            }
            else{
                let interval = setInterval(()=>{
                    if(messagesArray.length>0){
                        resolve(messagesArray.pop());
                        clearInterval(interval);
                    }
                },100)
            }
        })
    }

    async function initHttp(){
        let username = "mudu" + Math.random();
        let password = "muduvau123@";

        //admin authentication:
        const adminSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + "-admin",
            password,
            type: "admin"
        });

        adminId = adminSignup.data.userId;

        const adminSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-admin",
            password: password
        })
        
        adminToken = adminSignin.data.token;

        //user authentication:
        const userSignup = await axios.post(`${BACKEND_URL}/api/v1/signup`,{
            username: username + "-user",
            password,
            type: "user"
        });

        userId = userSignup.data.userId;

        const userSignin = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password
        })
        
        userToken = userSignin.data.token;

        //element creation:
        const element1 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name: "Chair1",
            width: 2,
            height: 2,
	        elementImg: "https://e7.pngegg.com/pngimages/912/409/png-clipart-pixelated-penguin-illustration-pixel-penguin-pixel-art-pixel-art-game-animals-thumbnail.png",
	        static: false
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        })

        element1Id = element1.data.elementId;

        const element2 = await axios.post(`${BACKEND_URL}/api/v1/admin/element`,{
            name:"Chair2",
            width:8,
            height:10,
	        elementImg: "https://static.vecteezy.com/system/resources/previews/025/212/486/non_2x/an-8-bit-retro-styled-pixel-art-illustration-of-a-purple-crystal-free-png.png",
	        static: true
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        element2Id = element2.data.elementId;

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`,{
            name : "Crazy Map",
            thumbnail: "https://wallpapers.com/images/hd/pixel-game-3mt15l3duvd9nh97.jpg",
            dimensions: "100x100",
            defaultElements: [{
                elementId: element1Id,
                x: 10,
                y: 20
            },{
                elementId: element2Id,
                x: 30,
                y: 40
            }]
        },{
            headers:{
                authorization: `Bearer ${adminToken}`
            }
        });

        mapId = mapResponse.data.mapId;

        const spaceCreateResponse = await axios.post(`${BACKEND_URL}/api/v1/spaces`,{
            name : "test",
            mapId : mapId,
            dimensions: "70x50" 
        },{
            headers:{
                authorization: `Bearer ${userToken}`
            }
        });

        spaceId = spaceCreateResponse.data.spaceId;
    }

    async function initWs(){
        ws1 = new WebSocket(WEBSOCKET_URL);
        ws2 = new WebSocket(WEBSOCKET_URL);
        await new Promise((r)=>{
            ws1.on('open',r)
        })
        await new Promise((r)=>{
            ws2.on('open',r);
        })
        ws1.onmessage = (event) => {
            ws1Messages.push(JSON.parse(event.data));
        }
        ws2.onmessage = (event) => {
            ws2Messages.push(JSON.parse(event.data));
        }
    }

    beforeAll(async()=>{
        await initHttp();
        await initWs();
    })

    test('Get Acknowledgement for joining a space', async () => { 
        ws1.send(JSON.stringify({
            "type": "join",
            "payload":{
                "spaceId": spaceId,
                "token": adminToken
            }
        }));
        const message = await waitForAndPopLatestMessage(ws1Messages);
        expect(message.type).toBe('space-joined');
        adminX = message.payload.spawn.x;
        adminY = message.payload.spawn.y;

        ws2.send(JSON.stringify({
            "type": "join",
            "payload":{
                "spaceId": spaceId,
                "token": userToken
            }
        }));

        const message1 = await waitForAndPopLatestMessage(ws1Messages);
        const message2 = await waitForAndPopLatestMessage(ws2Messages);

        expect(message1.type).toBe("user-joined");
        expect(message2.type).toBe("space-joined");
        
        userX = message2.payload.spawn.x;
        userY = message2.payload.spawn.y;
    });

    test('User is able to move and other sockets get position brodcasted',async()=>{
        ws1.send(JSON.stringify({
            "type": "move",
            "payload":{
                "coords":{
                    "x": adminX+1,
                    "y": adminY
                }
            }
        }));

        const message2 = await waitForAndPopLatestMessage(ws2Messages);
        expect(message2.type).toBe("user-moved");
        expect(message2.payload.userId).toBe(adminId);
        expect(message2.payload.coords.x).toBe(adminX+1);
        expect(message2.payload.coords.y).toBe(adminY);
        
        //update adminX for future tests:
        adminX += 1;
    })

    test('User should not be able to move 2 blocks at once',async()=>{
        ws1.send(JSON.stringify({
            "type": "move",
            "payload":{
                "coords":{
                    "x": adminX+2,
                    "y": adminY
                }
            }
        }));
        
        const message1 = await waitForAndPopLatestMessage(ws1Messages);
        expect(message1.type).toBe("movement-rejected");
        expect(message1.payload.coords.x).toBe(adminX);
        expect(message1.payload.coords.y).toBe(adminY);
    })

    test('User is able to leave a space and other sockets get brodcasted', async () => {
        ws1.close();

        const message2 = await waitForAndPopLatestMessage(ws2Messages);
        expect(message2.type).toBe("user-left");
        expect(message2.payload.userId).toBe(adminId);
    })
})
