import React, { useState } from 'react'
import Popup from 'reactjs-popup'

const InplaceConfirm: React.FC<any> = (props: any) => {
  const [ViewConfirm, SetViewConfirm] = useState<boolean>(false)
  const Toggle = () => {
    SetViewConfirm(!ViewConfirm)
  }
  return (
    <div
      className={`inplace-confirm ${props.ClassName ? 'cust-schedule' : ''}`}
    >
      {ViewConfirm ? (
        props.IsCenter ? (
          <Popup
            closeOnDocumentClick={false}
            open={ViewConfirm}
            onClose={() => {
              // cleanup
            }}
            closeOnEscape={false}
            contentStyle={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              justifyContent: 'center'
            }}
          >
            <div className='inplace-confirm'>
              <div
                className='main-body'
                style={{ boxShadow: 'none', position: 'inherit' }}
              >
                <div className='confirm-text'>
                  {props.ConfirmationText || 'Are you sure?'}
                </div>
                <div>
                  <button id='no-action' onClick={Toggle}>
                    No
                  </button>
                  <button
                    id='yes-action'
                    onClick={() => {
                      Toggle()
                      props.Action()
                    }}
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </Popup>
        ) : (
          <div className='main-body'>
            <div className='confirm-text'>
              {props.ConfirmationText || 'Are you sure?'}
            </div>
            <div>
              <button id='no-action' onClick={Toggle}>
                No
              </button>
              <button
                id='yes-action'
                onClick={() => {
                  Toggle()
                  props.Action()
                }}
              >
                Yes
              </button>
            </div>
          </div>
        )
      ) : null}
      <div className={`confirm-btn-html ${props.ClassName || ''}`}>
        <span onClick={Toggle}>{props.HTMLComponent}</span>
      </div>
    </div>
  )
}

export default InplaceConfirm
