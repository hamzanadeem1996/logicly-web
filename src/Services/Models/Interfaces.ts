export interface InputProps{
    control: any;
    showError: any;
    className?: string;
    type: string;
    placeholder: string;
    name: string;
    required: boolean;
    componentName?: string;
    disabled: boolean;
    ID?: string;  
}

export interface IApiCallStatus {
    InProgress: boolean;
    Failed: boolean;
    FailMessage: string;
  }