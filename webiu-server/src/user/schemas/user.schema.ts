import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  githubId: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationToken: string;

  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  matchPassword: (password: string) => Promise<boolean>;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Instance method to compare passwords
UserSchema.methods.matchPassword = async function (
  password: string,
): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};
