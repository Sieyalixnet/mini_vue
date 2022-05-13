export function initProps(instance, rawProps){
    instance.props=rawProps || {}//因为第一层的props是undefined, 但是它仍然去调用了reactive, 所以是不合理的. 
}