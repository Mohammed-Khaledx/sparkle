export interface User {
  _id: string;
  profilePicture: {
    url: string;
  };
  name: string;
  bio:string;
  email: string;
  isAdmin: string;
  createdAt: string;
}
