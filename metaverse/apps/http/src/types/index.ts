import z from "zod"
import { Request } from "express";

export interface AuthenticatedRequest extends Request{
    userId? : string
}

export const SignupSchema = z.object({
    username: z.string().min(5),
    password: z.string().min(8),
    type: z.enum(["user","admin"])
});

export const SigninSchema = z.object({
    username: z.string(),
    password: z.string().min(8)
});

export const UpdateMetadataSchema = z.object({
    avatarId: z.string()
});

export const CreateSpaceSchema = z.object({
    name: z.string(),
    dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/).optional(),
    mapId: z.string().optional()
});

export const AddElementSchema = z.object({
    elementId: z.string(),
    spaceId: z.string(),
    x: z.number(),
    y: z.number()
});

export const CreateElementSchema = z.object({
    name: z.string(),
    width: z.number(),
    height: z.number(),
    elementImg: z.string().url(),
    static: z.boolean()
});

export const DeleteElementSchema = z.object({
    spaceElementId: z.string(),
    spaceId: z.string()
})

export const UpdateElementSchema = z.object({
    elementImg: z.string().url()
});

export const CreateAvatarSchema = z.object({
    name: z.string(),
    avatarImg: z.string().url()
});

export const UpdateAvatarSchema = z.object({
    avatarImg: z.string().url()
});

export const CreateMapSchema = z.object({
    name: z.string(),
    dimensions: z.string().regex(/^[0-9]{1,4}x[0-9]{1,4}$/),
    thumbnail: z.string().url(),
    defaultElements: z.array(z.object({
        elementId: z.string(),
        x: z.number(),
        y: z.number()
    }))
});