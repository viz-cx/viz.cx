import { prop } from "@typegoose/typegoose"

export class Benificiary {
    @prop({ required: true })
    account!: string
    
    @prop({ required: true })
    weight!: number
}
