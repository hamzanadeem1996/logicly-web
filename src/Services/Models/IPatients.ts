
export interface IPatients {

    data: PatientsData;
    message: string;
}

export interface PatientsData {
    currentPage: number;
    items: PatientList[];
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
}

export interface PatientList {
    address: string;
    careTeamId: number;
    discharge: string;
    endDate: string;
    evaluation: string;
    firstName: string;
    frequency: string;
    fullName: string;
    id: number;
    lastModBy: number;
    lastModOn: string;
    lastName: string;
    mdName: string;
    mdNumber: string;
    noOfWeeks: number;
    notes: string;
    ot: string;
    preferredName: string;
    primaryNumber: string;
    pt: string;
    recert: string;
    secondaryNumber: string;
    slotDetail: string;
    sn: string;
    teamLeader: string;
    thirtyDaysRelEval: string;
    unavailableTimeSlot?: any;
    userId: number;
    visitsPerWeek: number;

    slp: any;
    ota: any;
    pta: any;
    aid: any;
    msw: any;
    countryId: any;
    stateId: any;
    cityId: any;
}

//PATIENT DETAILS

export interface IPatientDetailResponse{
    data:PatientList;
    message:string;
}