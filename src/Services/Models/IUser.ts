
export interface IUser {

    data: userData;
    message: string;
}

export interface userData {
    currentPage: number;
    items: userItems[];
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  }
  
export interface userItems {
    addedBy: number;
    addedOn: string;
    address?: any;
    cityId: number;
    email: string;
    firstName: string;
    fullName: string;
    id: number;
    lastModBy: number;
    lastModOn: string;
    lastName: string;
    lat: number;
    long: number;
    password?: any;
    roleId: number;
    token?: any;
  }