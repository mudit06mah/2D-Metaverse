import { Response } from "express"
import {
    AuthenticatedRequest,
    DeleteElementSchema,
    CreateSpaceSchema,
    AddElementSchema
} from "../types"

import client from "@repo/db"
import { authReqHandler} from "../utils/asyncHandler"

const createSpace = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) => {
        //data validation
        const parseData = CreateSpaceSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Data Validation Failed"
            })
        }
    
        const {name,dimensions,mapId} = req.body;
        const userId = req.userId ?? "";
    
        if(!mapId && !dimensions){
            return res
            .status(400)
            .json({
                message: "Either Map or Dimensions is required!"
            })
        }
    
        if(!mapId){
            let width = parseInt(dimensions.split("x")[0]);
            let height = parseInt(dimensions.split("x")[1]);

            try {
                const createdSpace = await client.space.create({
                    data:{
                        name,
                        width,
                        height,
                        creatorId: userId 
                    }
                });
    
                return res
                .status(200)
                .json({
                    spaceId: createdSpace.id,
                    message: "Space was Created Succesfully!"
                });
            } catch (error) {
                
                return res
                .status(400)
                .json({
                    message: "Space Could not be created!"
                });
            }
        }
    
        if(mapId){
            const map = await client.maps.findUnique({
                where:{
                    id: mapId
                },
                select: {
                    mapElements: true,
                    width: true,
                    height: true
                }
            });
            
    
            if(!map){
                return res
                .status(400)
                .json({
                    message: "Invalid Map Id"
                });
            }

            let width = dimensions?parseInt(dimensions.split("x")[0]) : map.width;
            let height = dimensions?parseInt(dimensions.split("x")[1]) : map.height;

            try {
                const space = await client.$transaction(async() => {
                    const createdSpace = await client.space.create({
                        data: {
                            name,
                            width,
                            height,
                            creatorId: userId,
                        }
                    });
    
                    await client.spaceElements.createMany({
                        data: map.mapElements.map((e:any) => ({
                            spaceId: createdSpace.id,
                            elementId: e.elementId,
                            x: e.x!,
                            y: e.y!
                        }))
                    });

                    return createdSpace;
                });

                return res
                    .status(200)
                    .json({
                        spaceId: space.id,
                        message: "Space created"
                    });
   
            } catch (error) {
            
                return res
                .status(400)
                .json({
                    message: "Space Could not be created"
                });
            }
        }
    
    }
);

const deleteSpace = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) => {
        const spaceId = req.params.spaceId;
    
        //check if space exists:
        const space = await client.space.findUnique({
            where:{
                id: spaceId
            },
            select:{
                creatorId: true
            }
        });
        
        if(!space){
            return res
            .status(400)
            .json({
                message: "Space does not exist!"
            })
        }
    
        //check if user is creator of the space:
        if(space?.creatorId !== req.userId){
            return res
            .status(403)
            .json({
                message: "Unauthorized"
            })
        }
    
        //delete the space:
        try {
            
            await client.space.delete({
                where: {
                    id: spaceId
                }
            })
    
            return res
            .status(200)
            .json({
                message: "Space was deleted succesfully!"
            });

        } catch (error) {
            return res
            .status(500)
            .json({
                message:"Could not delete space" 
            })
        }
        
    }
);

const getExistingSpaces = authReqHandler(
    async(req:AuthenticatedRequest, res:Response) => {
        try {
            const spaces = await client.space.findMany({
                where: {
                    creatorId: req.userId
                }
            });
    
            return res
            .status(200)
            .json({
                spaces: spaces.map((s:any)=> ({
                    id: s.id,
                    name: s.name,
                    thumbnail: s.thumbnail,
                    dimensions: `${s.width}x${s.height}`
                })),
                message: "Success!"
            });
            
        } catch (error) {
            return res
            .status(400)
            .json({
                message: "Could not get Spaces"
            });
        }   
    }
);

const addElementInSpace = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) => {
        //data validation:
        const parseData = AddElementSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Data Validation Failed"
            });
        }
    
        const {elementId, spaceId, x, y} = req.body;
        const userId = req.userId;
    
        //checking if user is owner of the space:
        const space = await client.space.findUnique({
            where: {
                id: spaceId,
                creatorId: userId
            },
            select:{
                width: true,
                height: true
            }
        });
    
        if(!space){
            return res
            .status(403)
            .json({
                message: "Unauthorized"
            });
        }
    
        //checking if element is out of bounds:
        if(x > space.width || y>space.height || x < 0 || y < 0){
            return res
            .status(400)
            .json({
                message: "Element is Out of Bounds!"
            });
        }
    
        //creating space:
        try {
            await client.spaceElements.create({
                data: {
                    x,
                    y,
                    spaceId,
                    elementId
                }
            });
    
            return res
            .status(200)
            .json({
                message: "Element was added succesfully!"
            })
        } catch (error) {
            return res
            .status(500)
            .json({
                message: "Could not add element!"
            })
        }
    }
);

const deleteElementInSpace = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) => {
        
        //data validaiton
        const parseData = DeleteElementSchema.safeParse(req.body);
        if(!parseData.success){
            return res
            .status(400)
            .json({
                message: "Data Validation Failed"
            })
        }
    
        const {spaceElementId,spaceId} = req.body;
        const userId = req.userId;
    
        //check if user is the creator of the space:
        const space = await client.space.findUnique({
            where: {
                id: spaceId,
                creatorId: userId
            },
        })
    
        if(!space){
            return res
            .status(403)
            .json({
                message: "Unauthorized"
            })
        }
    
        //delete the space:
        try {
            await client.spaceElements.delete({
                where: {
                    id:spaceElementId,
                }
            });
    
            return res
            .status(200)
            .json({
                message: "Element was deleted!"
            });
        } catch (error) {
            return res
            .status(500)
            .json({
                message:"Could not delete Element"
            });
        }
        
    }
);

const getSpaceInfo = authReqHandler(
    async(req:AuthenticatedRequest,res:Response) => {
    const spaceId = req.params.spaceId;

    const space = await client.space.findUnique({
        where: {
            id: spaceId
        },
        include: {
            spaceElements: {
                include: {
                    element: true
                }
            },
        }
    });

    if(!space){
        return res
        .status(400)
        .json({
            message: "Could not find Space"
        })
    }
    console.log(space.spaceElements.map(e=>e.element));

    const spaceTest = await client.space.findUnique({
        where: {
            id: spaceId
        }
    });

    return res
    .status(200)
    .json({
            id:space.id,
            name: space.name,
            thumbnail: space.thumbnail,
            dimensions: `${space.width}x${space.height}`,
            elements: space.spaceElements.map((se: any) => ({
                id:se.id,
                element:{
                    id: se.element.id,
                    imageUrl: se.element.elementImg,
                    width: se.element.width,
                    height: se.element.height,
                    static: se.element.static
                },
                x: se.x,
                y: se.y
            }))
        }
    );
}
);


export {
    createSpace,
    deleteSpace,
    getExistingSpaces,
    addElementInSpace,
    deleteElementInSpace,
    getSpaceInfo
}