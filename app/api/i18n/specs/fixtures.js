import {db} from 'api/utils';
export default {
  translations: [
    {
      _id: db.id(),
      type: 'translation',
      locale: 'en',
      contexts: [
        {
          id: 'System',
          label: 'System',
          values: {
            Password: 'Password',
            Account: 'Account',
            Email: 'E-Mail',
            Age: 'Age'
          }
        },
        {
          id: 'Filters',
          label: 'Filters',
          values: {}
        },
        {
          id: 'Menu',
          label: 'Menu',
          values: {}
        },
        {
          id: 'entity_template_id',
          label: 'Judge',
          values: {}
        },
        {
          id: 'document_template_id',
          label: 'Court order',
          values: {}
        }
      ]
    },
    {
      _id: db.id(),
      type: 'translation',
      locale: 'es',
      contexts: [
        {
          id: 'System',
          label: 'System',
          values: {
            Password: 'Contraseña',
            Account: 'Cuenta',
            Email: 'Correo electronico',
            Age: 'Edad'
          }
        }
      ]
    }
  ],
  settings: [
    {
      _id: db.id(),
      type: 'settings',
      languages: [
        {
          key: 'es',
          label: 'Español'
        },
        {
          key: 'en',
          label: 'English',
          default: true
        }
      ]
    }
    //{
      //_id: 'entity_template_id',
      //type: 'template',
      //isEntity: true
    //},
    //{
      //_id: 'document_template_id',
      //type: 'template',
      //isEntity: false
    //}
  ]
};
