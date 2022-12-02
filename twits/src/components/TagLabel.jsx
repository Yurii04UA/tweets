import React from 'react'
import CloseIcon from '../assets/close.svg'

const TagLabel = (props) => {
    const deleteHandler = (e) => {
        e.stopPropagation()
        props.setSearchParams(prev => (prev.get('filters')
        .split(' OR ')
        .filter(item => !item.includes(props.tag.replace('@','from:'))).length > 0 ?
        {filters: prev.get('filters')
        .split(' OR ')
        .filter(item => !item.includes(props.tag.replace('@','from:'))).join(' OR ')} :
              {}
          ))
        props.setQuery(prev => prev.filter(item => !item.includes(props.tag) && item !== ' ' && item !== '#' && item !== '@'))
    }
  return (
    <div className='tagLabel'>
        <span>{props.tag}</span>
        <img alt='close' onClick={deleteHandler} width={16} src={CloseIcon}/>
    </div>
  )
}

export default TagLabel