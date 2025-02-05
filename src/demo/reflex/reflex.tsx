import React from 'react'

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'

import 'react-reflex/styles.css'
import './reflex.css'

export class ReflexDemo extends React.Component {


  render () {

    return (
      <ReflexContainer orientation="vertical">

        <ReflexElement className="left-pane">
          <div className="pane-content">
            <label>
              Left Pane (resizable)
            </label>
          </div>
        </ReflexElement>

        <ReflexSplitter/>

        <ReflexElement className="right-pane" minSize={200} maxSize={800}>
          <div className="pane-content">
            <label>
              Right Pane (resizable)
              <br/>
              <br/>
              minSize = 200px
              <br/>
              maxSize = 800px
            </label>
          </div>
        </ReflexElement>

      </ReflexContainer>
    )
  }
}

