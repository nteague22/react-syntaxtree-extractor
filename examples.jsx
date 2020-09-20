import React from 'react';

export const DirectComponentNoProps = () => {
    return <div className="container">
        <h1>Title text</h1>
    </div>;
}
/**
 * Deconstruted props
 * @param {{id: string, name: string, title: string}} param0 
 */
export const DirectComponentWithObjectProps = ({id, name, title}) => {
    return <div id={id}>
        <h1>{title}</h1> 
        <span>{`Welcome ${name}!`}</span>
    </div>
}

export const DirectComponentWithMemberProps = (props) => {
    return <div id={props.id}>
        <h1>{props.title}</h1>
        <span>{`Welcome ${props.name}!`}</span>
    </div>
}

/**
 * Deconstructed Functional Component
 * @param {{id: number, age: number}} param0 
 */
export function FunctionalComponent({id, age}) {
    return <div id={id}>
        <h1>You are {age} years old!</h1>
    </div>
}
