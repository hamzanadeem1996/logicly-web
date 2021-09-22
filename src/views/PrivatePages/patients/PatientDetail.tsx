import React, { useEffect, useState } from 'react'
import * as API from '../../../Services/Api'
import * as UTIL from '../../../Services/utility'
import { useHistory } from 'react-router'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  IPatientDetailResponse,
  PatientList
} from '../../../Services/Models/IPatients'

import { LoaderComponent } from '../../../Controls/Loader'
import moment from 'moment'
import Calendar from '../../../Controls/Calendar'
import FrequencyPopup from './FrequencyPopup'
import VisitDates from './VisitDates'

import Tippy from '@tippyjs/react'
import 'tippy.js/dist/tippy.css'

const initialValues = {
  address: '',
  careTeamId: 1,
  // cna: "",
  discharge: '',
  endDate: '',
  evaluation: '',
  firstName: '',
  frequency: '',
  fullName: '',
  id: 1,
  lastModBy: 1,
  lastModOn: '',
  lastName: '',
  mdName: '',
  mdNumber: '',
  noOfWeeks: 1,
  notes: '',
  ot: '',
  preferredName: '',
  primaryNumber: '',
  pt: '',
  recert: '',
  secondaryNumber: '',
  slotDetail: '',
  sn: '',
  teamLeader: '',
  thirtyDaysRelEval: '',
  unavailableTimeSlot: '',
  userId: 1,
  visitsPerWeek: 1,
  countryId: 0,
  stateId: 0,
  cityId: 0
}

let _tippyIntance: any = undefined
let cb: any = undefined
let FetchCB: any = undefined
let FetchRecertsCB: any = undefined
const PatientDetail: React.FC = () => {
  const [detail, setDetail] = useState<any>({
    address: '',
    careTeamId: 0,
    // cna: '',
    discharge: '',
    endDate: '',
    evaluation: '',
    firstName: '',
    frequency: '',
    fullName: '',
    id: 0,
    lastModBy: 0,
    lastModOn: '',
    lastName: '',
    mdName: '',
    mdNumber: '',
    noOfWeeks: 0,
    notes: '',
    ot: '',
    preferredName: '',
    primaryNumber: '',
    pt: '',
    recert: '',
    secondaryNumber: '',
    slotDetail: '',
    sn: '',
    teamLeader: '',
    thirtyDaysRelEval: '',
    unavailableTimeSlot: '',
    userId: 0,
    visitsPerWeek: 0,
    countryId: 0,
    stateId: 0,
    cityId: 0
  })

  // tippy
  const [Frequency, SetFrequency] = useState({
    Data: [],
    HaveFreq: false
  })

  const [Data, SetData] = useState({
    Items: [],
    HaveItems: false
  })

  const [Eval, SetEval] = useState<any>('')
  const [IsEdit, SetEdit] = useState<boolean>(false)
  const [Inprogress, SetInprogress] = useState<boolean>(false)

  const [haveData, SetHaveData] = useState(false)
  const [state, setState] = useState({
    ShowPopup: false,
    ShowVisitDates: false,
    RecertPopup: false
  })

  const [ErrorCollection, SetErrorCollection] = useState<any>({
    sn: false,
    aid: false,
    pt: false,
    pta: false,
    ot: false,
    ota: false,
    msw: false,
    slp: false,
    teamLeader: false
  })

  const history = useHistory()
  const params: any = useParams()
  console.log('params.id', params.id)
  const { control, handleSubmit, errors, reset } = useForm<PatientList>({
    defaultValues: initialValues,
    mode: 'onBlur' // when the you blur... check for errors
  })

  const [visitHistory, SetVisitHistory] = useState<any[]>([])
  const [legends, SetLegends] = useState<any>([])
  const [ApiStaus, SetApiStatus] = useState<any>({
    InProgress: false,
    Failed: false,
    FailMessage: ''
  })
  useEffect(() => {
    getDetails()
  }, [reset])

  const GetVisitTypes = async () => {
    let result: any = await API.GetData('/PatientVisitHistory/GetVisitType')
    console.log(result, 'result')
    if (result.data) {
      result = result.data
      SetLegends([...result])
    }
  }

  const GetPatientVisitHistory = async () => {
    let result: any = await API.GetData(
      `/PatientVisitHistory/GetVisitHistory?pagenumber=1&pagesize=1000&patientid=${params.id}`
    )
    console.log(result, 'result')

    if (result.data) {
      result = result.data
      let arr: any[] = []
      result.forEach((v: any, i: any) => {
        let temp: any = moment(v.start)
          .utc()
          .format('MMM DD YYYY')
        temp = new Date(temp)
        let obj = {
          date: temp,
          class: v.colorType
        }
        arr.push(obj)
        if (i + 1 == result.length) {
          SetVisitHistory(arr)
          console.log(arr, 'HISTORY')
        }
      })
    }
  }

  const getDetails = async () => {
    //
    GetVisitTypes()

    GetPatientVisitHistory()

    let result: IPatientDetailResponse = await API.GetPatient(params.id)

    let PatientDetails: any = result.data

    // Select Values
    reset({
      ...PatientDetails
    })

    // Label Values
    if (PatientDetails != null) {
      // SetEval(moment(PatientDetails.evaluation).format('YYYY-MM-DD'))
      setDetail(PatientDetails)
    }
    SetHaveData(true)
  }
  // EOC should be 60 days from Initial Admission.
  var eocDate = detail.admission;
  var eocDateStr = String(eocDate);
  const newDate = new Date(eocDateStr);
  var finalEoc = newDate.setDate(newDate.getDate() + 60);
  var EOC = UTIL.getDate(finalEoc);

  // 5-day window should start 5 days before the EOC
  var fiveWindow;
  if (detail.recert != '') {
    var fWindow = new Date(finalEoc);
    var finalFiveWindow = fWindow.setDate(fWindow.getDate() - 5);
    fiveWindow = UTIL.getDate(finalFiveWindow);
  }
  // Upcoming 30DRE should be 30 days after the Initial Evaluation.
  var DRE;
  if (detail.evaluation != "N/A") {
    if (detail.mostRecent30DRE != '') {
      var initialEval = String(detail.evaluation);
      const newEval = new Date(initialEval);
      var finalDRE = newEval.setDate(newEval.getDate() + 30);
      DRE = UTIL.getDate(finalDRE);
    }  
  }
  
  const saveData = async (data: any) => {
    try {
      if (params.id != undefined) {
        data.id = params.id
      }
      let res = await API.Save(data)
      console.log(res, 'SAVED DATA')

      // Success
      GoBack()
    } catch (err) {
      console.log(err, 'ERROR ON SAVING/UPDATING DATA')
    }
  }

  const onSubmit = async (data: PatientList) => {
    //
    let FormIsValid = true
    let keys = Object.keys(ErrorCollection)

    keys.forEach((key: string) => {
      FormIsValid = !ErrorCollection[key] && FormIsValid
      //
      ErrorCollection[key] = !detail[key]
    })

    if (!FormIsValid) {
      console.log('invalid submission')
      SetErrorCollection({
        ...ErrorCollection
      })
      return
    }
    console.log(detail, 'check')

    SetHaveData(false)
    let userID = UTIL.readFromLocalStorage('userData_Apex').id

    let arr = []
    let obj = {
      startdate: detail.evaluation,
      enddate: detail.endDate
    }
    arr.push(obj)

    //
    detail.unavailableTimeSlot = arr

    saveData(detail)
  }

  const GoBack = () => {
    history.push('/patients')
  }

  // const FormatDate = (date: any) => {
  //   if (!date) return 'N/A'
  //   return moment(date)
  //     .utc()
  //     .format('MMM DD, YYYY')
  // }

  const OpenRecertificationsPopup = () => {
    console.log('recert popup')
    if (FetchRecertsCB) FetchRecertsCB()
    setState({
      ...state,
      RecertPopup: true,
      ShowPopup: true
    })
  }

  const UpdateEvaluation = async () => {
    if (Inprogress) return
    try {
      SetInprogress(true)
      // TO
      TimeOut()
      //
      let updtBool: boolean =
        UTIL.getDate(detail.evaluation, 'YYYY-MM-DD', true) !== Eval

      console.log('update ?', updtBool, Eval, detail.evaluation)
      if (updtBool) {
        // debugger
        let utcEval = Eval + 'T00:00:00.000Z'
        let result: any = await API.GetData(
          `/PatientProfile/SetEvaluationDate?patientId=${params.id}&Date=${utcEval}`
        )
        console.log('result', result)

        if (result.status == 402) {
          throw result
        }

        if (result.message == 'Successful') {
          setDetail({
            ...detail,
            evaluation: Eval
          })
          // getDetails()
          UTIL.ShowAlert(result.message)
        }
      }
      SetEdit(false)
    } catch (err) {
      console.log('err', err)
      UTIL.ShowAlert(err.message, 'error')
      //
      setDetail({
        ...detail,
        evaluation: detail.evaluation
      })
      SetEdit(false)
      //
    } finally {
      SetInprogress(false)
      getDetails()
    }
  }

  const TimeOut = () => {
    setTimeout(() => {
      SetInprogress(false)
    }, 3000)
  }

  let IsLatest: any = ''
  const FetchFrequency = async (patient: any) => {
    console.log('fetch....')
    try {
      //
      let temp: any = Math.random()
      IsLatest = temp

      SetFrequency({ Data: [], HaveFreq: false })
      let result: any = await API.GetData(
        `/PatientSchedule/Get?patientId=${patient.id}&recertId=${patient.activeCertId}`
      )
      console.log('result', result)

      if (result.data.items) {
        result = result.data.items

        result = result.reduce((a: any, c: any) => {
          console.log('...', a, c)
          let check = a.findIndex((ele: any) => {
            return ele.ClinicianId == c.clinicianId
          })
          let obj: any = {
            ClinicianId: c.clinicianId,
            ClinicianName: c.clinicianName,
            Data: []
          }
          // alert(check)
          if (check !== -1) {
            obj.Data = a[check].Data
            obj.Data.push(c)
            a[check] = obj
          } else {
            obj.Data.push(c)
            a.push(obj)
          }

          return a
        }, [])

        //
        if (temp === IsLatest) {
          SetFrequency({
            Data: result,
            HaveFreq: true
          })
        }
      }
    } catch (err) {
      console.log(err.message, 'err')
    }
  }

  const FetchDates = async (patient: any) => {
    console.log('fetch week....')
    try {
      //
      let temp: any = Math.random()
      IsLatest = temp

      SetData({ Items: [], HaveItems: false })
      let result: any = await API.GetData(
        `/PatientProfile/GetMultipleVisit?patientId=${patient.id}&recertId=${patient.activeCertId}&type=${patient.type}`
      )
      console.log('result', result)

      if (result.data) {
        result = result.data

        //
        if (temp === IsLatest) {
          SetData({
            Items: result,
            HaveItems: true
          })
        }
      }
    } catch (err) {
      console.log(err.message, 'err')
    }
  }

  const TippyContent = () => {
    return (
      <div className='freq-view'>
        <h2>FREQUENCIES</h2>
        <div
          className={`freq-wrapper ${
            Frequency.Data.length == 0 ? 'cust-loader' : ''
          }`}
        >
          {!Frequency.HaveFreq
            ? 'Loading...'
            : Frequency.Data.map((data: any) => {
                return (
                  <div className='item'>
                    <label>{data.ClinicianName}</label>
                    {data.Data.map((val: any) => {
                      return <span>{val.generatedVisitCode}</span>
                    })}
                  </div>
                )
              })}
          {Frequency.Data.length === 0 && Frequency.HaveFreq ? 'N/A' : null}
        </div>
      </div>
    )
  }

  const TippyContentDates = ({ Header = 'N/A', DataAccessor = '' }) => {
    return (
      <div className='freq-view'>
        <h2>{Header}</h2>
        <div
          className={`freq-wrapper ${
            Data.Items.length == 0 ? 'cust-loader' : ''
          }`}
        >
          {!Data.HaveItems
            ? 'Loading...'
            : Data.Items.map((data: any) => {
                return (
                  <div className='item'>
                    <label>{data.nurseName}</label>
                    <span>{data[DataAccessor] || 'N/A'}</span>
                  </div>
                )
              })}
          {Data.Items.length === 0 && Data.HaveItems ? 'N/A' : null}
        </div>
      </div>
    )
  }

  return (
    <div className='white-container patient-details'>
      <div id='Template'></div>
      <VisitDates
        ShowPopup={state.ShowVisitDates}
        OnPopupClose={() => {
          setState({ ...state, ShowVisitDates: !state.ShowVisitDates })
        }}
        SetupCB={(fn: any) => {
          cb = fn
        }}
        PatientId={params.id}
      />
      <FrequencyPopup
        ShowPopup={state.ShowPopup}
        RecertPopup={state.RecertPopup}
        PatientData={detail}
        FetchData={(fn: any) => {
          FetchCB = fn
        }}
        FetchRecerts={(fn: any) => {
          FetchRecertsCB = fn
        }}
        CallBackForNewFrequencySet={(FrequencySet: any) => {
          setDetail({
            ...detail,
            frequency: FrequencySet
          })
        }}
        OnPopupClose={() => {
          setState({
            ...state,
            ShowPopup: !state.ShowPopup,
            RecertPopup: false
          })
          getDetails()
        }}
      />
      {haveData ? (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className='patient-detail'>
            <h1>
              Patient Details{' '}
              <span>
                Visit Dates
                <i
                  className='hand fas fa-calendar-day'
                  onClick={() => {
                    setState({ ...state, ShowVisitDates: true })
                    if (cb) cb()
                  }}
                />
                Edit
                <i
                  className={`fas fa-edit hand ${
                    !UTIL.ManagePatientAllowed() ? 'disabled-ico' : ''
                  }`}
                  onClick={() => {
                    if (!UTIL.ManagePatientAllowed()) return
                    history.push(`/patients/add?patient_id=${params.id}`)
                  }}
                ></i>
              </span>
            </h1>

            <div className='personal-detail'>
              {/* New Layout */}
              <div className='row'>
                <div className='col-md-7'>
                  <div className='row'>
                    {/* Row 1 */}
                    <div className='col-md-12'>
                      <em>Patient Name</em>
                      <span>{detail.fullName}</span>
                    </div>
                    {/* Row 2 */}
                    <div className='col-md-4'>
                      <em>Initial Admission</em>
                      <span>{UTIL.getDate(detail.admission)}</span>
                    </div>
                    <div className='col-md-4  inplace-edit-container'>
                      {IsEdit ? (
                        <span className='inplace-edit'>
                          <input
                            type='date'
                            value={Eval}
                            className='form-control'
                            onChange={e => {
                              SetEval(e.target.value)
                            }}
                            disabled={Inprogress}
                          />
                          <span
                            className='tick-bottom'
                            onClick={UpdateEvaluation}
                          >
                            <i className='fas fa-check hand'></i>
                          </span>
                        </span>
                      ) : (
                        <>
                          <em>Initial Evaluation</em>
                          <span
                            onClick={() => {
                              SetEval(
                                UTIL.getDate(
                                  detail.evaluation,
                                  'YYYY-MM-DD',
                                  true
                                )
                              )
                              SetEdit(true)
                            }}
                            className='underline-text hand'
                          >
                            {UTIL.getDate(detail.evaluation)}
                          </span>
                        </>
                      )}
                    </div>
                    <div
                      className='col-md-4'
                      // title={
                      //   detail.dischargeValue && detail.dischargeValue != 'N/A'
                      //     ? FormatDate(detail.dischargeValue)
                      //     : ''
                      // }
                    >
                      <em>Discharge Week</em>
                      {UTIL.IsAdmin() ? (
                        <Tippy
                          content={TippyContentDates({
                            Header: 'DISCHARGE WEEK',
                            DataAccessor: 'dischargeWeek'
                          })}
                          animation={'scale-subtle'}
                          interactive={true}
                          placement={'right'}
                          onMount={() => {
                            console.log('mount fetch week...')
                            FetchDates({
                              activeCertId: detail.activeCertId,
                              id: params.id,
                              type: 'Discharge'
                            })
                          }}
                        >
                          <span className='hand'>View</span>
                        </Tippy>
                      ) : (
                        <span>{detail.dischargeWeek || 'N/A'}</span>
                      )}
                    </div>
                    {/* Row 3 */}
                    <div className='col-md-4'>
                      <em>Frequency</em>
                      {UTIL.IsAdmin() ? (
                        <Tippy
                          content={TippyContent()}
                          animation={'scale-subtle'}
                          interactive={true}
                          placement={'right'}
                          onMount={() => {
                            console.log('mount fetch...')
                            FetchFrequency({
                              activeCertId: detail.activeCertId,
                              id: params.id
                            })
                          }}
                        >
                          <span className='freq hand' id='myButton'>
                            View
                          </span>
                        </Tippy>
                      ) : (
                        <span className='freq'>
                          {detail.frequency || 'N/A'}
                        </span>
                      )}
                    </div>
                    <div className='col-md-4'>
                      <em>Most Recent 30DRE</em>
                      <span className='freq'>
                        {detail.mostRecent30DRE || 'N/A'}
                      </span>
                    </div>
                    <div className='col-md-4'>
                      <em>Upcoming 30DRE</em>
                      <span className='freq'>
                        {/* {detail.upcoming30DRE || 'N/A'} */}
                        {DRE || 'N/A'}
                      </span>
                    </div>

                    {/* Row 4 */}
                    <div className='col-md-4'>
                      <em>5 Day Window</em>
                      {/* <span>{detail.recert || 'N/A'}</span> */}
                      <span>{fiveWindow || 'N/A'}</span>
                    </div>
                    <div className='col-md-4'>
                      <em>End of Care</em>
                      {/* <span>{UTIL.getDate(detail.eoc)}</span> */}
                      <span>{EOC}</span>
                    </div>

                    {/* Row 5 */}
                    <div className='col-md-12'>
                      <em>Address</em>
                      <span>{detail.address || 'N/A'}</span>
                    </div>
                    {/* Row 6 */}
                    <div className='col-md-12'>
                      <em>Notes</em>
                      <span>{detail.notes || 'N/A'}</span>
                    </div>
                    {/* Row 7 */}
                    <div className='col-md-12'>
                      <span
                        className='hand cert-period-btn'
                        onClick={OpenRecertificationsPopup}
                      >{`Certifications (${detail.certificationPeriodCount ||
                        0})`}</span>
                    </div>
                  </div>
                  {/* Second Section */}
                  <h4>Care Team </h4>
                  <div className='row'>
                    <div className='col-md-3'>
                      <em>Team Leader</em>
                      <span>{detail.teamLeaderName}</span>
                    </div>
                    <div className='col-md-3'>
                      <em>OT</em>
                      <span>{detail.otname}</span>
                    </div>
                    <div className='col-md-3'>
                      <em>OTA</em>
                      <span>{detail.otaName}</span>
                    </div>
                    <div className='col-md-3'>
                      <em>PT</em>
                      <span>{detail.ptName || 'N/A'}</span>
                    </div>
                    <div className='col-md-3'>
                      <em>PTA</em>
                      <span>{detail.ptaName || 'N/A'}</span>
                    </div>
                    <div className='col-md-3'>
                      <em>SLP</em>
                      <span>{detail.slpName || 'N/A'}</span>
                    </div>{' '}
                    <div className='col-md-3'>
                      <em>SN</em>
                      <span>{detail.snName || 'N/A'}</span>
                    </div>
                    <div className='col-md-3'>
                      <em>AID</em>
                      <span>{detail.aidName}</span>
                    </div>
                    <div className='col-md-3'>
                      <em>MSW</em>
                      <span>{detail.mswName}</span>
                    </div>
                  </div>
                </div>
                <div className='col-md-5'>
                  <div className='row'>
                    <div className='col-md-12 footer-section-patient'>
                      <p>
                        <a href={'tel:' + detail.mdNumber}>
                          <img src='../../images/phone.svg' alt='' />
                          <span>MD</span>
                        </a>
                      </p>
                      <p>
                        <a href={'tel:' + detail.primaryNumber}>
                          <img src='../../images/phone.svg' alt='' />
                          <span>Primary</span>
                        </a>
                      </p>
                      <p>
                        <a href={'tel:' + detail.secondaryNumber}>
                          <img src='../../images/phone.svg' alt='' />
                          <span>Secondary</span>
                        </a>
                      </p>
                      <div
                        className='auto-schedule'
                        onClick={() => {
                          UTIL.navigateToGoogleMaps(detail.lat, detail.long)
                        }}
                        title='Navigate'
                      >
                        <img src='../../images/nav.svg' alt='' />
                      </div>
                    </div>
                    <div className='history-calendar'>
                      <em>Visit History</em>
                      <Calendar
                        minDate={new Date()}
                        maxDate={new Date()}
                        eventDates={visitHistory}
                        legends={legends}
                      />
                    </div>
                  </div>
                </div>
              </div>
              {/*  */}
            </div>

            <div className='row buttons'>
              <div className='col-md-6'>
                <button
                  id='patient-cancel'
                  type='button'
                  className='cancel-btn'
                  onClick={GoBack}
                >
                  Go Back
                </button>
                {ApiStaus.Failed ? (
                  <div>
                    <label className='text-danger'>
                      {ApiStaus.FailMessage}
                    </label>
                  </div>
                ) : null}
              </div>
              <div className='col-md-6'></div>
            </div>
          </div>
        </form>
      ) : (
        <LoaderComponent />
      )}
    </div>
  )
}

export default PatientDetail
