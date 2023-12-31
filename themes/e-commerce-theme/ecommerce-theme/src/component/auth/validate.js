export default function validate(values) {
  //input: values = {field: value, field2: value} eg { email: zachary@var-x.com, phone: 555-555-5555 }
  //output: { field: valid } eg { email: true, phone: true }
  const validators = {
    email: val => /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(val),
    password: val =>
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(
        val
      ),
    confirmPwd: val =>
      /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$/.test(
        val
      ),
  }

  const valid = {}

  Object.keys(values).map(field => {
    valid[field] = validators[field](values[field])
  })

  return valid
}
